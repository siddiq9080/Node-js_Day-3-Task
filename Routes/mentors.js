import express from "express";
import mongoose from "mongoose";
import { mentorModel } from "../models/mentor-model.js";
import { studentModel } from "../models/student-model.js";
import { v4 as uuid } from "uuid";

const mentorsRouter = express.Router();

//GET ( get all mentors )

mentorsRouter.get("/", async (req, res) => {
  try {
    const mentors = await mentorModel.find({});
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ msg: "Error retriving Mentors details", error });
  }
});

//POST ( create a new Mentor )

mentorsRouter.post("/", async (req, res) => {
  const mentorData = req.body;

  try {
    const existingMentor = await mentorModel.findOne({
      mentor_email: mentorData.mentor_email,
    });

    if (existingMentor) {
      res.status(409).json({ msg: "Mentor already exists" });
    } else {
      const mentorObj = new mentorModel({
        mentor_id: uuid(),
        ...mentorData,
      });

      await mentorObj.save();
      res.status(201).json({ msg: "Mentor created successfully" });
    }
  } catch (error) {
    console.error("Error creating Mentor :", error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ msg: "some filelds missing" });
    } else {
      res.status(500).json({ msg: "Internal server Error" });
    }
  }
});

// PUT ( Edit a single user )

mentorsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;

  const updateData = req.body;

  try {
    const updateMentor = await mentorModel.findOneAndUpdate(
      { mentor_id: id },
      updateData,
      { new: true }
    );

    if (updateMentor) {
      res.json({ msg: "Mentor details updated successfully" });
    } else {
      res.status(404).json({ msg: "Mentor not available" });
    }
  } catch (error) {
    res.status(500).json({ msg: "error updating Mentor", error });
  }
});

// GET ( get a single mentor using id )

mentorsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const mentor = await mentorModel.findOne({ mentor_id: id });

    if (mentor) {
      res.json(mentor);
    } else {
      res.status(404).json({ msg: "Mentor not found" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Error retriving Mentor", error });
  }
});

// DELETE ( delete a single Mentor )

mentorsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const mentor = await mentorModel.findOneAndDelete({ mentor_id: id });

    if (mentor) {
      res.json({ msg: "Mentor delted successfully" });
    } else {
      res.status(404).json({ msg: "Mentor not found" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Error deleting Mentor", error });
  }
});

// POST (Assign multiple students to a mentor)

mentorsRouter.post("/:mentor_id/assign-students", async (req, res) => {
  const { mentor_id } = req.params;
  const { student_ids } = req.body; // Expecting an array of student IDs

  try {
    const mentor = await mentorModel.findOne({ mentor_id });
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    for (const student_id of student_ids) {
      const student = await studentModel.findOne({ student_id });
      if (student && !student.current_mentor) {
        student.current_mentor = mentor_id;
        mentor.student_list.push(student_id);
        await student.save();
      }
    }
    await mentor.save();

    res.json({ msg: "Students assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Error assigning students", error });
  }
});

// GET (Get all students for a specific mentor)
mentorsRouter.get("/:mentor_id/students", async (req, res) => {
  const { mentor_id } = req.params;

  try {
    const mentor = await mentorModel.findOne({ mentor_id });
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    const students = await studentModel
      .find({
        current_mentor: mentor_id,
      })
      .select("-_id student_id student_name student_email");

    res.json(students);
  } catch (error) {
    res.status(500).json({ msg: "Error retrieving students", error });
  }
});

// POST (Change mentor for a particular student)
mentorsRouter.post("/:mentor_id/change/:student_id", async (req, res) => {
  const { mentor_id, student_id } = req.params;

  try {
    const student = await studentModel.findOne({ student_id: student_id });
    const mentor = await mentorModel.findOne({ mentor_id: mentor_id });

    if (!student) return res.status(404).json({ msg: "Student not found" });
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    // Update the student's current mentor and previous mentor
    student.previous_mentor = student.current_mentor; // Keep track of the previous mentor
    student.current_mentor = mentor_id;

    await student.save();

    // Update the mentor's student list if necessary
    if (!mentor.student_list.includes(student_id)) {
      mentor.student_list.push(mentor_id);
      await mentor.save();
    }

    res.json({ msg: "Mentor changed successfully for student" });
  } catch (error) {
    res.status(500).json({ msg: "Error changing mentor", error });
  }
});

// DELETE (Delete a mentor and reassign their students)
mentorsRouter.delete("/:mentor_id ", async (req, res) => {
  const { mentor_id } = req.params;

  try {
    const mentor = await mentorModel.findOneAndDelete({ mentor_id: mentor_id });

    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    // Reassign students to a default mentor or set their current_mentor to null
    await studentModel.updateMany(
      { current_mentor: mentor_id },
      { current_mentor: null, previous_mentor: mentor_id }
    );

    res.json({ msg: "Mentor deleted successfully and students reassigned" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting mentor", error });
  }
});

export default mentorsRouter;
