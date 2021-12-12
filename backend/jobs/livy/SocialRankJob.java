package edu.upenn.cis.nets212.hw3.livy;

import java.io.IOException;
import java.io.Serializable;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.livy.Job;
import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.RowFactory;
import org.apache.spark.sql.Row;
import scala.Tuple2;

import edu.upenn.cis.nets212.config.Config;
import edu.upenn.cis.nets212.storage.SparkConnector;
import scala.Tuple2;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

public class SocialRankJob implements Job<List<MyPair<Integer, Double>>> {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * Connection to Apache Spark
	 */
	SparkSession spark;

	JavaSparkContext context;

	private boolean useBacklinks;

	private String source;

	static final double decayFactor = 0.15;

	final double dmax;
	final int imax;
	final boolean debugMode;

	/**
	 * Initialize the database connection and open the file
	 * 
	 * @throws IOException
	 * @throws InterruptedException
	 * @throws DynamoDbException
	 */
	public void initialize() throws IOException, InterruptedException {
		System.out.println("Connecting to Spark...");
		spark = SparkConnector.getSparkConnection();
		context = SparkConnector.getSparkContext();

		System.out.println("Connected!");
	}

	/**
	 * Fetch the social network from the S3 path, and create a (follower, followed)
	 * edge graph
	 * 
	 * @param filePath
	 * @return JavaPairRDD: (follower: int, followed: int)
	 */
	JavaPairRDD<Integer, Integer> getSocialNetwork(String filePath) {
		JavaRDD<String> lines = context.textFile(filePath); // load data from S3

		// split by whitespace, map to rows
		JavaRDD<Row> rows = lines.map(line -> RowFactory.create((Object[]) line.trim().split("\\s+")))
				.filter(row -> row.size() == 2);

		// map to <follower, followed> pairs
		JavaPairRDD<Integer, Integer> edgeRDD = rows
				.mapToPair(row -> new Tuple2<>(Integer.parseInt(row.getString(0)), Integer.parseInt(row.getString(1))))
				.distinct();

		return edgeRDD;
	}

	private interface SerializableComparator<T> extends Comparator<T>, Serializable {
		static <T> SerializableComparator<T> serialize(SerializableComparator<T> comparator) {
			return comparator;
		}
	}

	/**
	 * Main functionality in the program: read and process the social network
	 * 
	 * @throws IOException          File read, network, and other errors
	 * @throws DynamoDbException    DynamoDB is unhappy with something
	 * @throws InterruptedException User presses Ctrl-C
	 */
	public List<MyPair<Integer, Double>> run() throws IOException, InterruptedException {
		System.out.println("Running");

		// Load the social network
		JavaPairRDD<Integer, Integer> edgeRDD = getSocialNetwork(source); // <follower, followed>
		JavaPairRDD<Integer, Integer> reverseEdgeRDD = edgeRDD.mapToPair(Tuple2::swap); // <followed, follower>
		JavaRDD<Integer> nodes = context.union(edgeRDD.keys(), reverseEdgeRDD.keys()).distinct(); // all nodes in graph
		System.out.println(String.format("This graph contains %d nodes and %d edges", nodes.count(), edgeRDD.count()));

		// Compute the out-degree of each node
		JavaPairRDD<Integer, Integer> nodeOutDegreeRDD = context
				.union(edgeRDD.mapToPair(t -> new Tuple2<>(t._1(), 1)), nodes.mapToPair(n -> new Tuple2<>(n, 0)))
				.aggregateByKey(0, Integer::sum, Integer::sum);

		if (useBacklinks) {
			// Compute sinks
			JavaRDD<Integer> sinks = nodeOutDegreeRDD.filter(t -> t._2() == 0).keys();
			System.out.println(String.format("This graph contains %d sink nodes", sinks.count()));

			// Compute back-edges
			JavaPairRDD<Integer, Integer> backEdges = reverseEdgeRDD
					.join(sinks.mapToPair(sink -> new Tuple2<>(sink, 0)))
					.mapToPair(t -> new Tuple2<>(t._1(), t._2()._1()));
			edgeRDD = context.union(edgeRDD, backEdges);

			System.out.println(String.format("Added %d backlinks", backEdges.count()));

			// Re-compute the out-degree of each node
			nodeOutDegreeRDD = context
					.union(edgeRDD.mapToPair(t -> new Tuple2<>(t._1(), 1)), nodes.mapToPair(n -> new Tuple2<>(n, 0)))
					.aggregateByKey(0, Integer::sum, Integer::sum);
		}

		// Initialize social rank values
		JavaPairRDD<Integer, Double> socialRankRDD = nodes.mapToPair(node -> new Tuple2<>(node, Double.valueOf(1)));

		// Run iterative social rank algorithm
		final double decayFactor = SocialRankJob.decayFactor;
		for (int i = 0; i < imax; i++) {
			// Compute node -> socialRank value to send to each out-neighbor
			JavaPairRDD<Integer, Double> socialRankOutgoingRDD = socialRankRDD.join(nodeOutDegreeRDD)
					.mapToPair(t -> new Tuple2<>(t._1(), t._2()._1() / t._2()._2()));

			// Compute node -> incoming socialRank value
			JavaPairRDD<Integer, Double> socialRankIncomingRDD = edgeRDD.join(socialRankOutgoingRDD)
					.mapToPair(t -> t._2()).aggregateByKey(Double.valueOf(0.0), Double::sum, Double::sum);

			// Compute new socialRank values
			JavaPairRDD<Integer, Double> newSocialRankRDD = socialRankIncomingRDD
					.mapToPair(t -> new Tuple2<>(t._1(), decayFactor + (1 - decayFactor) * t._2()));

			// Compute max change in socialRank
			double maxChange = socialRankRDD.join(newSocialRankRDD)
					.mapToPair(t -> new Tuple2<>(t._1(), Math.abs(t._2()._1() - t._2()._2())))
					.aggregate(Double.valueOf(0.0), (maxDiff, t) -> Math.max(maxDiff, t._2()), Math::max);

			// Set socialRankRDD
			socialRankRDD = newSocialRankRDD;

			// Print socialRankRDD if in debug mode
			if (debugMode) {
				System.out.println(String.format("Social rank values after iteration %d:", i));
				socialRankRDD.map(t -> String.format("%d %f", t._1(), t._2())).collect().stream()
						.forEach(System.out::println);
			}

			// Break if dmax maxChange threshold has been reached
			if (maxChange <= dmax) {
				break;
			}
		}

		// Find top 10 social rank nodes/values
		List<Tuple2<Integer, Double>> topSocialRankRDD = socialRankRDD.takeOrdered(10,
				SerializableComparator.serialize((row1, row2) -> row2._2().compareTo(row1._2())));

		System.out.println("*** Finished social network ranking! ***");

		return topSocialRankRDD.stream().map(t -> new MyPair<>(t._1(), t._2())).collect(Collectors.toList());
	}

	/**
	 * Graceful shutdown
	 */
	public void shutdown() {
		System.out.println("Shutting down");
	}

	public SocialRankJob(boolean useBacklinks, String source, double dmax, int imax, boolean debugMode) {
		System.setProperty("file.encoding", "UTF-8");

		this.useBacklinks = useBacklinks;
		this.source = source;
		this.dmax = dmax;
		this.imax = imax;
		this.debugMode = debugMode;
	}

	@Override
	public List<MyPair<Integer, Double>> call(JobContext arg0) throws Exception {
		initialize();
		return run();
	}

}
