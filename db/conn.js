import "dotenv/config"
import { MongoClient } from "mongodb";
const connectionString = process.env.ATLAS_URI || "";
const client = new MongoClient(connectionString);

let conn;
try { 
  conn = await client.connect()
  console.log("Connected to Mongo")
} catch (err) {
  console.log(err)
}

const db = conn.db("sample_training");
const collection = db.collection("grades");
//create a single-field index on class_id
await collection.createIndex({ class_id: 1 });
//Create a single-field index on learner_id
await collection.createIndex({ learner_id: 1 });
//Create a compound index on learner_id and class_id, in that order, both ascending
await collection.createIndex({ learner_id: 1, class_id: 1 });

await db.command({
  collMod: 'grades',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['class_id', 'learner_id'],
      properties: {
        class_id: {
          bsonType: 'int',
          minimum: 0,
          maximum: 300,
          description: 'must be an integer in [0, 300] and is required'
        },
        learner_id: {
          bsonType: 'int',
          minimum: 0,
          description: 'must be an integer greater than or equal to 0 and is required'
        }
      }
    }
  },
  validationAction: 'warn'
});

export default db