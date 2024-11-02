const express = require('express');
const router = express.Router();
const db = require('./db'); // assuming you have a database connection setup

router.get('/grades/stats', async (req, res) => {
  const pipeline = [
    {
      $match: {
        weightedAverage: { $gt: 70 }
      }
    },
    {
      $count: 'learnersAbove70'
    },
    {
      $addFields: {
        totalLearners: {
          $sum: 1
        }
      }
    },
    {
      $addFields: {
        learnersAbove49: {
          $sum: {
            $cond: [{ $gt: ['$weightedAverage', 49] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        learnersAbove70: 1,
        totalLearners: 1,
        learnersAbove49: 1,
        percentageAbove49: {
          $multiply: [{ $divide: ['$learnersAbove49', '$totalLearners'] }, 100]
        }
      }
    }
  ];

  router.get('/grades/stats/:id', async (req, res) => {
    const classId = req.params.id;
    const pipeline = [
      {
        $match: {
          class_id: ObjectId(classId)
        }
      },
      {
        $addFields: {
          above70: {
            $gt: ['$weightedAverage', 70]
          },
          above49: {
            $gt: ['$weightedAverage', 49]
          }
        }
      },
      {
        $group: {
          _id: null,
          learnersAbove70: {
            $sum: {
              $cond: ['$above70', 1, 0]
            }
          },
          totalLearners: {
            $sum: 1
          },
          learnersAbove49: {
            $sum: {
              $cond: ['$above49', 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          learnersAbove70: 1,
          totalLearners: 1,
          learnersAbove49: 1,
          percentageAbove49: {
            $multiply: [{ $divide: ['$learnersAbove49', '$totalLearners'] }, 100]
          }
        }
      }
    ];

  const result = await db.collection('grades').aggregate(pipeline).toArray();
  res.json(result[0]);
});