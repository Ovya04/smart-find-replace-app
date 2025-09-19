import React, { useState } from 'react';

const PreviewTable = ({ results, onApply, onBack, isLoading }) => {
  const [selectedChanges, setSelectedChanges] = useState(new Set());

  const handleSelectAll = () => {
    if (selectedChanges.size === results.results.length) {
      setSelectedChanges(new Set());
    } else {
      setSelectedChanges(new Set(results.results.map((_, index) => index)));
    }
  };

  const handleSelectChange = (index) => {
    const newSelection = new Set(selectedChanges);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedChanges(newSelection);
  };

  const handleApply = () => {
    const changesToApply = Array.from(selectedChanges).map(index => results.results[index]);
    onApply(changesToApply);
  };

  if (!results.success) {
    return (
      <div className="error-message">
        <h2>❌ Scan Error</h2>
        <p>{results.error}</p>
        <button onClick={onBack} className="back-button">← Back</button>
      </div>
    );
  }

  return (
    <div className="preview-table">
      <div className="preview-header">
        <button onClick={onBack} className="back-button">← Back</button>
        
        <div className="preview-stats">
          <h2>📊 Scan Results</h2>
          <div className="stats">
            <span className="stat">
              <strong>{results.totalEntries}</strong> entries scanned
            </span>
            <span className="stat">
              <strong>{results.entriesWithChanges}</strong> with changes
            </span>
            <span className="stat">
              <strong>{results.results.reduce((sum, r) => sum + r.changes.reduce((s, c) => s + c.changeCount, 0), 0)}</strong> total replacements
            </span>
          </div>
        </div>

        <div className="preview-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedChanges.size === results.results.length}
              onChange={handleSelectAll}
            />
            Select All
          </label>
          
          <button 
            onClick={handleApply}
            disabled={selectedChanges.size === 0 || isLoading}
            className="apply-button"
          >
            {isLoading ? '⏳ Applying...' : `✅ Apply ${selectedChanges.size} Changes`}
          </button>
        </div>
      </div>

      <div className="preview-content">
        {results.results.map((entry, index) => (
          <div key={entry.entryUid} className="entry-preview">
            <div className="entry-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedChanges.has(index)}
                  onChange={() => handleSelectChange(index)}
                />
                <span className="entry-title">{entry.title}</span>
              </label>
              
              <div className="entry-meta">
                <span className="content-type">{entry.contentTypeUid}</span>
                <span className="change-count">{entry.changes.length} field(s)</span>
              </div>
            </div>

            <div className="changes-list">
              {entry.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="change-item">
                  <div className="change-header">
                    <strong>{change.field}</strong>
                    <span className="change-count-badge">{change.changeCount} change(s)</span>
                  </div>
                  
                  <div className="change-diff">
                    <div className="before">
                      <label>Before:</label>
                      <div className="text-preview">
                        {truncateText(typeof change.before === 'string' ? change.before : JSON.stringify(change.before))}
                      </div>
                    </div>
                    
                    <div className="arrow">→</div>
                    
                    <div className="after">
                      <label>After:</label>
                      <div className="text-preview">
                        {truncateText(typeof change.after === 'string' ? change.after : JSON.stringify(change.after))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to truncate long text
function truncateText(text, maxLength = 200) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default PreviewTable;
