import express from "express";
import mongoose from "mongoose";
import { studentModel } from "../models/student-model.js";
import { mentorModel } from "../models/mentor-model.js";
import { v4 as uuid } from "uuid";

const studentsRouter = express.Router();

// GET all users

studentsRouter.get("/", async (req, res) => {
  try {
    const students = await studentModel.find({}).select("-_id"); 
    res.json(students);
  } catch (error) {
    res.status(500).json({ msg: "Error retriving students", error: e.message });
  }
});

// POST ( create a new student )

studentsRouter.post("/", async (req, res) => {
  const stuData = req.body;

  try {
    const existingStudent = await studentModel.findOne({
      student_email: stuData.student_email,
    });

    if (existingStudent) {
      return res.status(409).json({ msg: "Student already exists" });
    } else {
      const studentObj = new studentModel({
        student_id: uuid(),
        ...stuData,
      });

      await studentObj.save(); 
      res
        .status(201)
        .json({ msg: "Student created successfully", student: studentObj });
    }
  } catch (error) {
    console.error("Error creating student:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ msg: "Some fields are missing" });
    } else {
      res.status(500).json({ msg: "Internal server error" });
    }
  }
});

// PUT ( Edit a single user )

studentsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedStudent = await studentModel.findOneAndUpdate(
      { student_id: id },
      updateData,
      { new: true }
    );

    if (updatedStudent) {
      res.json({
        msg: "Student datails updated successfully",
        student: updatedStudent,
      });
    } else {
      res.status(404).json({ msg: "Student not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error updating student", error: error.message });
  }
});

// GET (get a single student)

studentsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const student = await studentModel.findOne({ student_id: id });

    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ msg: "Student not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error retrieving student", error: error.message });
  }
});

// DELETE (delete a single student)
studentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const student = await studentModel.findOneAndDelete({ student_id: id });

    if (student) {
      res.json({ msg: "Student deleted successfully" });
    } else {
      res.status(404).json({ msg: "Student not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error deleting student", error: error.message });
  }
});

// POST (Assign a student to a mentor)

studentsRouter.post(
  "/:student_id/assign-mentor/:mentor_id",
  async (req, res) => {
    const { student_id, mentor_id } = req.params;

    try {
      // Find the student by ID
      const student = await studentModel.findOne({ student_id });
      if (!student) {
        return res.status(404).json({ msg: "Student not found" });
      }

      // Find the mentor by ID
      const mentor = await mentorModel.findOne({ mentor_id });
      if (!mentor) {
        return res.status(404).json({ msg: "Mentor not found" });
      }

      // Check if student already has a current mentor
      if (student.current_mentor) {
        // Optional: Handle previous mentor (reassignment logic)
        const previousMentor = await mentorModel.findOne({
          mentor_id: student.current_mentor,
        });
        if (previousMentor) {
          previousMentor.student_list = previousMentor.student_list.filter(
            (id) => id !== student_id
          );
          await previousMentor.save(); 
        }
      }

      // Assign the mentor to the student
      student.current_mentor = mentor_id;

      // Add student to mentor's list if not already present
      if (!mentor.student_list.includes(student_id)) {
        mentor.student_list.push(student_id); 
      }

      // Save the updates
      await Promise.all([student.save(), mentor.save()]);

      res.json({ msg: "Student assigned to mentor successfully" });
    } catch (error) {
      console.error("Error assigning mentor:", error);
      res
        .status(500)
        .json({ msg: "Error assigning mentor", error: error.message });
    }
  }
);

// GET (Show all students for a particular mentor)
studentsRouter.get("/mentor/:mentorId", async (req, res) => {
  const { mentorId } = req.params;

  try {
    const mentor = await mentorModel.findOne({ mentor_id: mentorId });

    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    const students = await studentModel.find({
      current_mentor: mentorId,
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ msg: "Error retrieving students", error });
  }
});

// GET (Show the previously assigned mentor for a particular student)
studentsRouter.get("/:studentId/previous-mentor", async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await studentModel.findOne({ student_id: studentId });

    if (!student) return res.status(404).json({ msg: "Student not found" });

    res.json({ previous_mentor: student.previous_mentor });
  } catch (error) {
    res.status(500).json({ msg: "Error retrieving previous mentor", error });
  }
});

// PUT ( Change Student's Mentor )
studentsRouter.put(
  "/:student_id/change-mentor/:new_mentor_id",
  async (req, res) => {
    const { student_id, new_mentor_id } = req.params;

    try {
      // Find the student
      const student = await studentModel.findOne({ student_id });
      if (!student) return res.status(404).json({ msg: "Student not found" });

      // Find the new mentor
      const newMentor = await mentorModel.findOne({ mentor_id: new_mentor_id });
      if (!newMentor)
        return res.status(404).json({ msg: "New mentor not found" });

      // Store the previous mentor
      const previousMentorId = student.current_mentor;

      // Update the student's current mentor
      student.previous_mentor = previousMentorId; // Update previous mentor
      student.current_mentor = new_mentor_id; // Set the new mentor

      // If the student had a previous mentor, remove them from the student list
      if (previousMentorId) {
        const previousMentor = await mentorModel.findOne({
          mentor_id: previousMentorId,
        });
        if (previousMentor) {
          previousMentor.student_list = previousMentor.student_list.filter(
            (id) => id !== student_id
          );
          await previousMentor.save();
        }
      }

      // Add the student to the new mentor's list
      newMentor.student_list.push(student_id);
      await newMentor.save();

      // Save the updated student
      await student.save();

      res.json({ msg: "Student's mentor changed successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Error changing mentor", error });
    }
  }
);

export default studentsRouter;
