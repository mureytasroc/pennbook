package edu.upenn.cis.nets212.hw3.livy;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.livy.LivyClient;
import org.apache.livy.LivyClientBuilder;

import edu.upenn.cis.nets212.config.Config;

public class ComputeRanksLivy {
	public static void main(String[] args)
			throws IOException, URISyntaxException, InterruptedException, ExecutionException {

		// parse command-line arguments
		double dmax = 30.0;
		int imax = 25;
		boolean debugMode = false;
		if (args.length > 0) {
			dmax = Double.valueOf(args[0]);
		}
		if (args.length > 1) {
			imax = Integer.parseInt(args[1]);
		}
		if (args.length > 2) {
			debugMode = true;
		}

		LivyClient client = new LivyClientBuilder()
				.setURI(new URI("http://ec2-18-205-1-255.compute-1.amazonaws.com:8998/")).build();

		try {
			String jar = "target/nets212-hw3-0.0.1-SNAPSHOT.jar";

			System.out.printf("Uploading %s to the Spark context...\n", jar);
			client.uploadJar(new File(jar)).get();

			String sourceFile = Config.BIGGER_SOCIAL_NET_PATH; // SOCIAL_NET_PATH

			System.out.printf("Running SocialRankJob with %s as its input...\n", sourceFile);
			List<MyPair<Integer, Double>> resultWithBacklinks = client
					.submit(new SocialRankJob(true, sourceFile, dmax, imax, debugMode)).get();
			System.out.println("With backlinks: " + resultWithBacklinks);
			// List<MyPair<Integer, Double>> resultWithoutBacklinks = client
			// .submit(new SocialRankJob(false, sourceFile, dmax, imax, debugMode)).get();
			// System.out.println("Without backlinks: " + resultWithoutBacklinks);

			// Set<Integer> withBacklinksNodes = resultWithBacklinks.stream().map(p ->
			// p.getLeft())
			// .collect(Collectors.toSet());
			// Set<Integer> withoutBacklinksNodes = resultWithoutBacklinks.stream().map(p ->
			// p.getLeft())
			// .collect(Collectors.toSet());
			// Set<Integer> commonNodes = new HashSet<Integer>(withBacklinksNodes);
			// commonNodes.retainAll(withoutBacklinksNodes);
			// withBacklinksNodes.removeAll(commonNodes);
			// withoutBacklinksNodes.removeAll(commonNodes);

			// System.out.println("Common nodes: "
			// + commonNodes.stream().map(n ->
			// Integer.toString(n)).collect(Collectors.joining(",")));
			// System.out.println("Only with backlinks: "
			// + withBacklinksNodes.stream().map(n ->
			// Integer.toString(n)).collect(Collectors.joining(",")));
			// System.out.println("Only without backlinks: "
			// + withoutBacklinksNodes.stream().map(n ->
			// Integer.toString(n)).collect(Collectors.joining(",")));
		} finally {
			client.stop(true);
		}
	}

}
