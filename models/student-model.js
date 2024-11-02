import { model, Schema } from "mongoose";

const studentSchema = new Schema({
  student_id: {
    type: String,
    required: true,
  },

  student_name: {
    type: String,
    required: true,
  },

  student_email: {
    type: String,
    required: true,
    unique: true,
  },

  student_DOB: {
    type: String,
    required: true,
  },
  student_email: {
    type: String,
    required: true,
    unique: true,
  },
  current_mentor: {
    type: String,
    default: null,
  },
  previous_mentor: {
    type: String,
    default: null,
  },
});

export const studentModel = new model("student", studentSchema, "students");
