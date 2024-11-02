import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
const router = express.Router();
// The more specific a route is, the higher it should
// be in the file, so this is at the top.
//
// GET /grades/learner/0
// Backwards compatibility:
//Reroute /student/:id to /learner/:id
router.get("/student/:id", async (req, res) => {
    console.log("/student/:id being redirected to /learner/:id", req.params.id);
    res.redirect(`../learner/${req.params.id}`);
});
router.get("/learner/:id", async (req, res) => {
    console.log("/learner/:id", req.params.id);
    try {
        let collection = await db.collection("grades");
        let query = { learner_id: Number(req.params.id) };
        let result = await collection.find(query).toArray();
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    }
    catch (err) { next() }
});
// GET /grades/class/0
router.get("/class/:id", async (req, res) => {
    console.log("/class/:id", req.params.id);
    try {
        let collection = await db.collection("grades");
        let query = { class_id: Number(req.params.id) };
        let result = await collection.find(query).toArray();
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    }
    catch (err) { next() }
});
// Create a single grade entry
router.post("/", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let newDocument = req.body;
        // rename fields for backwards compatibility
        if (newDocument.student_id) {
            newDocument.learner_id = newDocument.student_id;
            delete newDocument.student_id;
        }
        let result = await collection.insertOne(newDocument);
        res.send(result).status(204);
    } catch (err) { next() }
});
// Get a single grade entry
router.get("/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
//        let query = { _id: new ObjectId(req.params.id) };
        let query = { _id: createFromHexString(req.params.id) };
        let result = await collection.findOne(query);
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Add a score to a grade entry
router.patch("/:id/add", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        // let query = { _id: new ObjectId(req.params.id) };
        let query = { _id: createFromHexString(req.params.id) };
        let result = await collection.updateOne(query, {
            $push: { scores: req.body },
        });
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Remove a score from a grade entry
router.patch("/:id/remove", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { _id: new ObjectId(req.params.id) };
        let result = await collection.updateOne(query, {
            $pull: { scores: req.body },
        });
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// BONUS: Extra route to combine both the add and remove routes
router.patch("/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { _id: new ObjectId(req.params.id) };
        let update = {};
        if (req.params.operation === "add") {
            update($push) = { scores: req.body };
        } else if (req.params.operation === "remove") {
            update($pull) = { scores: req.body };
        } else {
            res.status(400).send("Invalid Operation");
        }
        let result = await collection.updateOne(query, {
            $set: req.body,
        });
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Delete a single grade entry
router.delete("/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { _id: new ObjectId(req.params.id) };
        let result = await collection.deleteOne(query);
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Get a learner's grade data
// Optional query parameters: class
// Example: /grades/learner/0?class=0
router.get("/learner/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { learner_id: Number(req.params.id) };
        // Check for class_id parameter
        if (req.query.class) {
            query.class_id = Number(req.query.class);
        }
        let result = await collection.find(query).toArray();
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Delete a learner's grade data
router.delete("/learner/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { learner_id: Number(req.params.id) };
        let result = await collection.deleteOne(query);
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Get a class's grade data
router.get("/class/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { class_id: Number(req.params.id) };
        // Check for learner_id parameter
        if (req.query.learner)
            query.learner_id = Number(req.query.learner);
        let result = await collection.find(query).toArray();
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Update a class id
router.patch("/class/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { class_id: Number(req.params.id) };
        let result = await collection.updateMany(query, {
            $set: { class_id: req.body.class_id },
        });
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
// Delete a class
router.delete("/class/:id", async (req, res) => {
    try {
        let collection = await db.collection("grades");
        let query = { class_id: Number(req.params.id) };
        let result = await collection.deleteMany(query);
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    } catch (err) {
        next()
    }
});
export default router;













