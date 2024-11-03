// routes/grades.js
import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Create a single grade entry
router.post("/", async (req, res) => {
  let collection = await db.collection("grades");
  let newDocument = req.body;

  // Convert student_id to learner_id
  if (newDocument.student_id) {
    newDocument.learner_id = newDocument.student_id;
    delete newDocument.student_id;
  }

  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

// Get a single grade entry
router.get("/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Add a score to a grade entry
router.patch("/:id/add", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: ObjectId(req.params.id) };

  let result = await collection.updateOne(query, {
    $push: { scores: req.body }
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Remove a score from a grade entry
router.patch("/:id/remove", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: ObjectId(req.params.id) };

  let result = await collection.updateOne(query, {
    $pull: { scores: req.body }
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a single grade entry
router.delete("/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: ObjectId(req.params.id) };
  let result = await collection.deleteOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get route for backwards compatibility
router.get("/student/:id", async (req, res) => {
  res.redirect(`learner/${req.params.id}`);
});

// Get a learner's grade data
router.get("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };
  
  // Check for class_id parameter
  if (req.query.class) query.class_id = Number(req.query.class);

  let result = await collection.find(query).toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a learner's grade data
router.delete("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };

  let result = await collection.deleteOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get a class's grade data
router.get("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  // Check for learner_id parameter
  if (req.query.learner) query.learner_id = Number(req.query.learner);

  let result = await collection.find(query).toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Update a class id
router.patch("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.updateMany(query, {
    $set: { class_id: req.body.class_id }
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a class
router.delete("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get the weighted average of a specified learner's grades, per class
router.get("/learner/:id/avg-class", async (req, res) => {
    let collection = await db.collection("grades");

    
/**Create a GET route at /grades/stats
Within this route, create an aggregation pipeline that returns the following information:
The number of learners with a weighted average (as calculated by the existing routes) higher than 70%.
The total number of learners.
The percentage of learners with an average above 70% (a ratio of the above two outputs). */

    let result = await collection
      .aggregate([
        {
          $match: { learner_id: Number(req.params.id) },
        },
        {
          $unwind: { path: "$scores" },
        },
        {
          $group: {
            _id: "$class_id",
            quiz: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "quiz"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            exam: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "exam"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            homework: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "homework"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            class_id: "$_id",
            avg: {
              $sum: [
                { $multiply: [{ $avg: "$exam" }, 0.5] },
                { $multiply: [{ $avg: "$quiz" }, 0.3] },
                { $multiply: [{ $avg: "$homework" }, 0.2] },
              ],
            },
          },
        },
      ])
      .toArray();
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
  });

/** Create a GET route at /grades/stats/:id
Within this route, mimic the above aggregation pipeline, but only for learners within a class that has a class_id equal to the specified :id.*/

  router.get('/stats', async (req, res) => {
    try {
      const result = await db.collection('grades').aggregate([
        {
          $unwind: '$scores'
        },
        {
          $group: {
            _id: null,
            totalLearners: { $sum: 1 },
            totalScores: { $sum: 1 },
            totalWeightedScores: {
              $sum: {
                $cond: [
                  { $eq: ['$scores.type', 'exam'] },
                  { $multiply: ['$scores.score', 0.5] },
                  { $cond: [
                      { $eq: ['$scores.type', 'quiz'] },
                      { $multiply: ['$scores.score', 0.3] },
                      { $multiply: ['$scores.score', 0.2] }
                    ]}
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalLearners: 1,
            averageScore: { $divide: ['$totalWeightedScores', '$totalScores'] },
            learnersAbove50: {
              $sum: {
                $cond: [{ $gt: ['$averageScore', 50] }, 1, 0]
              }
            },
            percentageAbove50: {
              $multiply: [
                { $divide: ['$learnersAbove50', '$totalLearners'] },
                100
              ]
            }
          }
        }
      ]).toArray();
  
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/stats/:id", async (req, res) => {
    try {
      let collection = await db.collection("grades");
  
      let result = await collection
        .aggregate([
          { $match: { class_id: Number(req.params.id) } },
          {
            $group: {
              _id: null,
              totalLearners: { $sum: 1 },
              learnersAbove50: {
                $sum: {
                  $cond: [{ $gt: ["$average", 50] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalLearners: 1,
              learnersAbove50: 1,
              percentageAbove50: {
                $multiply: [
                  { $divide: ["$learnersAbove50", "$totalLearners"] },
                  100,
                ],
              },
            },
          },
        ])
        .toArray();
  
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

export default router;