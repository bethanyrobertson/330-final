{
  name: { type: String, required: true },
  type: { type: String, required: true },  // button, card, input, etc.
  description: { type: String },
  variants: [{ 
    name: String, 
    properties: Object 
  }],
  guidelines: { type: String },
  tags: [{ type: String }],
  styleGuideId: { type: mongoose.Schema.Types.ObjectId, ref: 'StyleGuide' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}