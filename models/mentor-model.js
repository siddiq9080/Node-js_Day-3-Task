import { model, Schema } from "mongoose";

const mentorSchema = new Schema({
  mentor_id: {
    type: String,
    required: true,
  },

  mentor_name: {
    type: String,
    required: true,
  },

  mentor_email: {
    type: String,
    unique: true,
    required: true,
  },

  language: {
    type: [String],
    required: true,
  },

  courses: {
    type: [String],
    required: true,
  },
  student_list: [
    {
      type: String,
      required: false,
    },
  ],
});

export const mentorModel = model("mentor", mentorSchema, "mentors");
