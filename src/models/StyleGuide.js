const mongoose = require('mongoose');
const slugify = require('slugify');

const styleGuideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a style guide name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  version: {
    type: String,
    required: [true, 'Please add a version'],
    trim: true,
    match: [/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  // Legacy color structure for backward compatibility
  colors: {
    primary: [String],
    secondary: [String],
    accent: [String],
    neutral: [String],
    semantic: {
      success: [String],
      warning: [String],
      error: [String],
      info: [String]
    }
  },
  // Legacy typography structure
  typography: {
    fontFamilies: [String],
    fontSizes: {
      type: Map,
      of: String
    },
    fontWeights: {
      type: Map,
      of: String
    },
    lineHeights: {
      type: Map,
      of: String
    }
  },
  spacing: [Number],
  borderRadius: {
    type: Map,
    of: String
  },
  shadows: {
    type: Map,
    of: String
  },
  breakpoints: {
    type: Map,
    of: String
  },
  // New design token summary
  tokenSummary: {
    totalTokens: { type: Number, default: 0 },
    categories: {
      type: Map,
      of: Number,
      default: new Map()
    },
    lastImport: Date
  },
  // Style guide metadata
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'team'
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
 {
  timestamps: true
});

// Create slug before saving
styleGuideSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Create indexes
styleGuideSchema.index({ name: 'text', description: 'text', tags: 'text' });
styleGuideSchema.index({ slug: 1 });
styleGuideSchema.index({ status: 1, visibility: 1 });
styleGuideSchema.index({ createdBy: 1 });

// Virtual for component count
styleGuideSchema.virtual('componentCount', {
  ref: 'Component',
  localField: '_id',
  foreignField: 'styleGuideId',
  count: true
});

// Ensure virtual fields are serialised
styleGuideSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StyleGuide', styleGuideSchema);