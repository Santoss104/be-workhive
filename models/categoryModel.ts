import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryModel extends Model<ICategory> {
  findByName(name: string): Promise<ICategory | null>;
}

const categorySchema = new mongoose.Schema<ICategory, ICategoryModel>(
  {
    name: {
      type: String,
      required: [true, "Please enter category name"],
      unique: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true });

// Add static method
categorySchema.static("findByName", function (name: string) {
  return this.findOne({ name: { $regex: name, $options: "i" } });
});

const CategoryModel = mongoose.model<ICategory, ICategoryModel>(
  "Category",
  categorySchema
);

export default CategoryModel;