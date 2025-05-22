const mongoose = require('mongoose');
const slugify = require('slugify');

const ComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a component name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: [
      'button',
      'form',
      'navigation',
      'layout',
      'data-display',
      'feedback',
      'overlay',
      'typography',
      'other'
    ],
    default: 'other'
  },
  code: {
    html: {
      type: String
    },
    css: {
      type: String
    },
    js: {
      type: String
    }
  },
  usedTokens: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Token'
  }],
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'deprecated'],
    default: 'draft'
  },
  tags: {
    type: [String],
    default: []
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for performance
ComponentSchema.index({ name: 1, project: 1 }, { unique: true });
ComponentSchema.index({ slug: 1, project: 1 }, { unique: true });
ComponentSchema.index({ category: 1 });
ComponentSchema.index({ status: 1 });
ComponentSchema.index({ 'tags': 1 });
// Create text index for search functionality
ComponentSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Create component slug from the name
ComponentSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Update the updatedAt timestamp
ComponentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Aggregation method to count components by category
ComponentSchema.statics.getCategoryCounts = async function(projectId) {
  const categoryCounts = await this.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(projectId) }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  return categoryCounts;
};

// Aggregation method to count components by status
ComponentSchema.statics.getStatusCounts = async function(projectId) {
  const statusCounts = await this.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(projectId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  return statusCounts;
};

module.exports = mongoose.model('Component', ComponentSchema);