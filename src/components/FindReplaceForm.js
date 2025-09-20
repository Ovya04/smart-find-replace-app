import React, { useState } from 'react';

const FindReplaceForm = ({ onScan, isLoading, config }) => {
  const [formData, setFormData] = useState({
    findTerm: '',
    replaceTerm: '',
    contentTypes: [],
    options: {
      contextAware: true,
      updateLinks: true,
      namedEntities: true,
      useBrandkit: true
    },
    brandKitId: config?.brandKitId || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.findTerm || !formData.replaceTerm) {
      alert('Please enter both find and replace terms');
      return;
    }
    onScan(formData);
  };

  const handleOptionChange = (option) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [option]: !prev.options[option]
      }
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const mapping = JSON.parse(event.target.result);
          // Handle bulk upload
          console.log('Bulk mapping:', mapping);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="find-replace-form">
      <div className="form-section">
        <h2>🔍 Find & Replace Terms</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="findTerm">Find:</label>
            <input
              type="text"
              id="findTerm"
              value={formData.findTerm}
              onChange={(e) => setFormData(prev => ({ ...prev, findTerm: e.target.value }))}
              placeholder="Enter text to find..."
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="replaceTerm">Replace with:</label>
            <input
              type="text"
              id="replaceTerm"
              value={formData.replaceTerm}
              onChange={(e) => setFormData(prev => ({ ...prev, replaceTerm: e.target.value }))}
              placeholder="Enter replacement text..."
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bulkUpload">Or upload bulk mappings (JSON):</label>
          <input
            type="file"
            id="bulkUpload"
            accept=".json"
            onChange={handleFileUpload}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-section">
        <h2>⚙️ Options</h2>
        
        <div className="options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.options.contextAware}
              onChange={() => handleOptionChange('contextAware')}
            />
            <span className="checkmark"></span>
            Context-aware replacement
            <small>Understand meaning, not just text matching</small>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.options.updateLinks}
              onChange={() => handleOptionChange('updateLinks')}
            />
            <span className="checkmark"></span>
            Update links automatically
            <small>Change both display text and URLs</small>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.options.namedEntities}
              onChange={() => handleOptionChange('namedEntities')}
            />
            <span className="checkmark"></span>
            Named entity replacement
            <small>Companies, people, emails, etc.</small>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.options.useBrandkit}
              onChange={() => handleOptionChange('useBrandkit')}
            />
            <span className="checkmark"></span>
            Use Brand Kit validation
            <small>Ensure brand compliance</small>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h2>📁 Content Types</h2>
        <p>Leave empty to scan all content types</p>
        <input
          type="text"
          placeholder="blog_posts, products, pages (comma separated)"
          value={formData.contentTypes.join(', ')}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            contentTypes: e.target.value.split(',').map(ct => ct.trim()).filter(ct => ct)
          }))}
          className="form-input"
        />
      </div>

      <button 
        type="submit" 
        className="scan-button"
        disabled={isLoading}
      >
        {isLoading ? '🔄 Scanning...' : '🔍 Scan Content'}
      </button>
    </form>
  );
};

export default FindReplaceForm;
