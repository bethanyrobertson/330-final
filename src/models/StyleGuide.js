const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a token name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  path: {
    type: String,
    required: [true, 'Please add a token path'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['color', 'typography', 'spacing', 'effect', 'grid', 'shape', 'other'],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Please add a token value']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  deprecated: {
    type: Boolean,
    default: false
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

// Create indexes 
TokenSchema.index({ name: 1, project: 1 }, { unique: true });
TokenSchema.index({ path: 1, project: 1 }, { unique: true });
TokenSchema.index({ category: 1 });
TokenSchema.index({ 'tags': 1 });
TokenSchema.index({ deprecated: 1 });
//  search functionality
TokenSchema.index({ name: 'text', path: 'text', description: 'text', tags: 'text' });


// generate CSS variable
TokenSchema.methods.toCssVariable = function() {
  const prefix = this.category === 'color' ? 'color' : this.category;
  const name = this.name.replace(/\./g, '-').toLowerCase();
  
  let value = '';
  if (typeof this.value === 'object' && this.value.value) {
    value = this.value.value;
  } else if (typeof this.value === 'string' || typeof this.value === 'number') {
    value = this.value;
  } else {
    value = JSON.stringify(this.value);
  }
  
  return `--${prefix}-${name}: ${value};`;
};

// Aggregation
TokenSchema.statics.getCategoryCounts = async function(projectId) {
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

module.exports = mongoose.model('Token', TokenSchema);