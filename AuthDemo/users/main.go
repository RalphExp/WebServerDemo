package main

import (
	"context"
	"crypto/sha256"
	"log"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func getEnvOrDefault(env, defValue string) string {
	s := os.Getenv(env)
	if s == "" {
		s = defValue
	}
	return s
}

func main() {
	users := map[string]string{
		"admin":      "fCRmh4Q2J7Rseqkz",
		"packt":      "RE4zfHB35VPtTkbT",
		"mlabouardy": "L3nSFRcZzNQ67bcc",
	}

	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(getEnvOrDefault("MONGO_URI", "mongodb://localhost:27017/")))
	if err = client.Ping(context.TODO(), readpref.Primary()); err != nil {
		log.Fatal(err)
	}

	collection := client.Database(getEnvOrDefault("MONGO_DATABASE", "test")).Collection("users")
	h := sha256.New()

	for username, password := range users {
		collection.InsertOne(ctx, bson.M{
			"username": username,
			"password": string(h.Sum([]byte(password))),
		})
	}
}
