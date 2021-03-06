import os
from random import random
from operator import add
import boto3
from operator import add
from datetime import datetime, timedelta
import gc
import random
from collections import defaultdict
from uuid import uuid4

from pyspark.sql import SparkSession

MIN_ITERATIONS = 2
MAX_ITERATIONS = 2
CONVERGENCE_THRESH = 0.2


def scan_whole_table(table):
    response = table.scan()
    data = response["Items"]
    while response.get("LastEvaluatedKey"):
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        data.extend(response["Items"])
    return data


def updateAdsorptionWeightsDynamoDB(tuples):
    dynamodb = boto3.resource(
        "dynamodb",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        region_name="us-east-1",
    )
    with dynamodb.Table("articlerankings").batch_writer() as batch:
        for username, (article_uuid, adsorption_weight) in tuples:
            batch.put_item(
                Item={
                    "username": username,
                    "articleUUID": article_uuid,
                    "adsorptionWeight": adsorption_weight,
                }
            )


def recommendArticlesDynamoDB(tuples):
    article_uuid_to_date = dict()
    user_to_candidates = defaultdict(lambda: ([], []))
    for username, (article_uuid, article_date, adsorption_weight) in tuples:
        article_uuid_to_date[article_uuid] = article_date
        user_to_candidates[username][0].append(article_uuid)
        user_to_candidates[username][1].append(adsorption_weight)
    user_to_recommendation = dict()
    for username, (choices, weights) in user_to_candidates.items():
        user_to_recommendation[username] = random.choices(choices, weights)[0]

    dynamodb = boto3.resource(
        "dynamodb",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        region_name="us-east-1",
    )
    with dynamodb.Table("recommendedarticles").batch_writer() as batch:
        for username, article_uuid in user_to_recommendation.items():
            batch.put_item(
                Item={
                    "username": username,
                    "articleUUID": article_uuid,
                    "recUUID": datetime.now().isoformat() + str(uuid4()),
                    "articleDate": article_uuid_to_date[article_uuid],
                }
            )


if __name__ == "__main__":
    spark = SparkSession.builder.appName("RecommendArticles").getOrCreate()

    dynamodb = boto3.resource(
        "dynamodb",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        region_name="us-east-1",
    )
    articles_table = dynamodb.Table("articles")
    article_items_to_tuples = lambda items: [
        ("uuid/" + item["articleUUID"], ("catg/" + item["category"], item["date"]))
        for item in items
    ]
    recommended_articles_table = dynamodb.Table("recommendedarticles")
    recommended_articles_to_tuples = lambda items: [
        (item["username"], (item["articleUUID"], item["articleDate"])) for item in items
    ]
    article_likes_table = dynamodb.Table("articlelikes")
    article_likes_items_to_tuples = lambda items: [
        ("uuid/" + item["articleUUID"], "user/" + item["username"]) for item in items
    ]
    users_table = dynamodb.Table("users")
    users_items_to_tuples = lambda items: [
        ("user/" + item["username"], "catg/" + interest)
        for item in items
        for interest in item["interests"]
    ]
    friendships_table = dynamodb.Table("friendships")
    friendships_items_to_tuples = lambda items: [
        ("user/" + item["username"], "user/" + item["friendUsername"])
        for item in items
        if item["confirmed"]
    ]

    articles_rdd = spark.sparkContext.parallelize(
        article_items_to_tuples(scan_whole_table(articles_table))
    )  # (uuid, category)
    gc.collect()
    recommended_articles_rdd = spark.sparkContext.parallelize(
        recommended_articles_to_tuples(scan_whole_table(recommended_articles_table))
    )  # (username, uuid)
    gc.collect()
    article_likes_rdd = spark.sparkContext.parallelize(
        article_likes_items_to_tuples(scan_whole_table(article_likes_table))
    )  # (uuid, username)
    gc.collect()
    users_rdd = spark.sparkContext.parallelize(
        users_items_to_tuples(scan_whole_table(users_table))
    )  # (username, interest)
    gc.collect()
    friendships_rdd = spark.sparkContext.parallelize(
        friendships_items_to_tuples(scan_whole_table(friendships_table))
    )  # (username1, username2)
    gc.collect()

    article_to_categories = articles_rdd.map(lambda t: (t[0], t[1][0]))

    category_to_articles = article_to_categories.map(lambda t: t[::-1])
    category_article_counts = category_to_articles.map(lambda t: (t[0], 1)).reduceByKey(add)
    category_to_article_edges = category_to_articles.join(category_article_counts).map(
        lambda t: (t[0], (t[1][0], 0.5 / t[1][1]))
    )

    user_friend_counts = friendships_rdd.map(lambda t: (t[0], 1)).reduceByKey(add)
    user_to_user_edges = friendships_rdd.join(user_friend_counts).map(
        lambda t: (t[0], (t[1][0], 0.3 / t[1][1]))
    )

    user_interest_counts = users_rdd.map(lambda t: (t[0], 1)).reduceByKey(add)
    user_to_category_edges = users_rdd.join(user_interest_counts).map(
        lambda t: (t[0], (t[1][0], 0.3 / t[1][1]))
    )

    user_likes = article_likes_rdd.map(lambda t: t[::-1])
    user_like_counts = user_likes.map(lambda t: (t[0], 1)).reduceByKey(add)
    user_to_article_edges = user_likes.join(user_like_counts).map(
        lambda t: (t[0], (t[1][0], 0.4 / t[1][1]))
    )

    articles_outbound = article_to_categories.union(article_likes_rdd)
    articles_outbound_counts = articles_outbound.map(lambda t: (t[0], 1)).reduceByKey(add)
    articles_outbound_edges = articles_outbound.join(articles_outbound_counts).map(
        lambda t: (t[0], (t[1][0], 1 / t[1][1]))
    )

    category_to_users = users_rdd.map(lambda t: t[::-1])
    category_users_counts = category_to_users.map(lambda t: (t[0], 1)).reduceByKey(add)
    category_to_users_edges = category_to_users.join(category_users_counts).map(
        lambda t: (t[0], (t[1][0], 0.5 / t[1][1]))
    )

    edges = (
        category_to_article_edges.union(user_to_user_edges)
        .union(user_to_category_edges)
        .union(user_to_article_edges)
        .union(articles_outbound_edges)
        .union(category_to_users_edges)
    )
    node_to_labels = user_interest_counts.map(lambda t: (t[0], (t[0], 1)))  # (node, (label, value))
    node_and_label_to_value = node_to_labels.map(
        lambda t: ((t[0], t[1][0]), t[1][1])
    )  # ((node, label), value)

    for i in range(MAX_ITERATIONS):
        print(f"Iteration {i}...")
        new_node_to_labels = (
            edges.join(node_to_labels)
            .map(
                lambda t: (t[1][0][0], (t[1][1][0], t[1][0][1] * t[1][1][1]))
            )  # (new_node, (label_name, edge_weight*label_value))
            .map(lambda t: ((t[0], t[1][0]), t[1][1]))  # ((new_node, label_name), label_value)
            .reduceByKey(add)
            .map(
                lambda t: (t[0][0], (t[0][1], 1 if t[0][0] == t[0][1] else t[1]))
            )  # (new_node, (label_name, label_value))
        )
        node_sums = new_node_to_labels.map(lambda t: (t[0], t[1][1])).reduceByKey(
            add
        )  # (new_node, label_sum)
        new_node_to_labels = new_node_to_labels.join(node_sums).map(
            lambda t: (t[0], (t[1][0][0], t[1][0][1] / t[1][1]))
        )  # (new_node, (label_name, label_value / label_sum))
        new_node_and_label_to_value = new_node_to_labels.map(
            lambda t: ((t[0], t[1][0]), t[1][1])
        )  # ((new_node, label_name), label_value)

        if i >= MIN_ITERATIONS:
            max_value_change = (
                node_and_label_to_value.join(new_node_and_label_to_value)
                .map(lambda t: abs(t[1][0] - t[1][1]))
                .max()
            )

        node_to_labels = new_node_to_labels
        node_and_label_to_value = new_node_and_label_to_value

        if i >= MIN_ITERATIONS and max_value_change < CONVERGENCE_THRESH:
            break
    print("Converged.")

    username_to_article_labels = node_to_labels.filter(lambda t: t[0].startswith("uuid/")).map(
        lambda t: (t[1][0][5:], (t[0][5:], t[1][1]))
    )  # (username, (uuid, weight))

    username_to_article_labels.foreachPartition(updateAdsorptionWeightsDynamoDB)

    yesterday = (datetime.now() - timedelta(hours=24)).isoformat()
    articles_today = articles_rdd.filter(lambda t: t[1][1] >= yesterday).map(
        lambda t: (t[0][5:], t[1][1])
    )  # (uuid, date)

    recommended_articles_today = recommended_articles_rdd.filter(
        lambda t: t[1][1] >= yesterday
    ).map(
        lambda t: ((t[0], t[1][0]), t[1][1])
    )  # ((username, uuid), date)

    username_to_candidate_recs = (
        username_to_article_labels.map(
            lambda t: (t[1][0], (t[0], t[1][1]))
        )  # (uuid, (username, weight))
        .join(articles_today)
        .map(
            lambda t: ((t[1][0][0], t[0]), (t[1][1], t[1][0][1]))
        )  # ((username, uuid), (date, weight))
        .subtractByKey(recommended_articles_today)
        .map(lambda t: (t[0][0], (t[0][1], t[1][0], t[1][1])))  # (username, (uuid, date, weight))
    )

    username_to_candidate_recs.foreachPartition(recommendArticlesDynamoDB)

    spark.stop()
