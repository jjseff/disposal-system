import { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import './App.css';

// Short terms dictionary for instant scanning
const branchShortCodes = { 
  "Pasay": "PS", "Cebu": "CB", "Munoz": "MZ", "Fairview": "FV" 
};

const typeShortCodes = { 
  "Monitor": "MN", "Keyboard": "KB", "Mouse": "MS", "Ram": "RM", "Heatsink": "HS" 
};

function App() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('disposal_options_v2');
    return saved ? JSON.parse(saved) : {
      branches: ["Pasay", "Cebu", "Munoz", "Fairview"],
      types: ["Monitor", "Keyboard", "Mouse", "Ram", "Heatsink"],
      // Brands are now categorized by Type
      brandsByType: {
        "Monitor": ["AOC", "Samsung", "Gigabyte"],
        "Keyboard": ["Logitech", "Razer"],
        "Mouse": ["Logitech", "A4Tech"],
        "Ram": ["Kingston", "Samsung"],
        "Heatsink": ["DeepCool", "Cooler Master"]
      }
    };
  });

  const [formData, setFormData] = useState({ branch: '', type: '', brand: '' });
  const [printQueue, setPrintQueue] = useState([]);
  const barcodeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('disposal_options_v2', JSON.stringify(options));
  }, [options]);

  const addNewItem = (category) => {
    if (category === 'brands') {
      if (!formData.type) return alert("Please select a Type first to add a brand to it.");
      const newItem = prompt(`Enter new Brand for ${formData.type}:`);
      if (newItem && newItem.trim() !== "") {
        const type = formData.type;
        setOptions(prev => ({
          ...prev,
          brandsByType: {
            ...prev.brandsByType,
            [type]: [...(prev.brandsByType[type] || []), newItem.trim()]
          }
        }));
      }
    } else {
      const newItem = prompt(`Enter new ${category}:`);
      if (newItem && newItem.trim() !== "") {
        setOptions(prev => ({ ...prev, [category]: [...prev[category], newItem.trim()] }));
      }
    }
  };

  const removeItem = (category, value) => {
    if (!value) return alert("Select an item in the dropdown to remove.");
    if (window.confirm(`Remove "${value}"?`)) {
      if (category === 'brands') {
        const type = formData.type;
        setOptions(prev => ({
          ...prev,
          brandsByType: {
            ...prev.brandsByType,
            [type]: prev.brandsByType[type].filter(item => item !== value)
          }
        }));
        setFormData({ ...formData, brand: '' });
      } else {
        setOptions(prev => ({ ...prev, [category]: prev[category].filter(item => item !== value) }));
        const field = category === 'branches' ? 'branch' : 'type';
        setFormData({ ...formData, [field]: '' });
      }
    }
  };

  const handleClearQueue = () => {
    if (printQueue.length === 0) return;
    if (window.confirm("Are you sure you want to clear the entire print queue?")) {
      setPrintQueue([]);
    }
  };

  const handleGenerate = () => {
    const { branch, type, brand } = formData;
    if (!branch || !type || !brand) return alert("Please fill all fields!");

    const sBranch = branchShortCodes[branch] || branch.substring(0, 2).toUpperCase();
    const sType = typeShortCodes[type] || type.substring(0, 2).toUpperCase();

    const combinedData = `${sBranch}|${sType}|${brand}`;
    const displayText = `${branch} - ${type} - ${brand}`;

    if (barcodeRef.current) {
      barcodeRef.current.innerHTML = "";
      JsBarcode(barcodeRef.current, combinedData, {
        format: "CODE128",
        width: 2.2,
        height: 65,
        displayValue: true,
        text: displayText,
        font: "monospace",
        fontSize: 14,
        margin: 10
      });

      const newEntry = {
        id: Date.now(),
        svgHtml: barcodeRef.current.outerHTML
      };
      setPrintQueue(prev => [...prev, newEntry]);
    }
  };

  const downloadImage = (format) => {
    const svg = barcodeRef.current;
    if (!svg) return alert("Generate a barcode first!");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 200;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const x = (canvas.width - svg.getBBox().width) / 2;
      const y = (canvas.height - svg.getBBox().height) / 2;
      ctx.drawImage(img, x, y);
      const imgUrl = canvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement("a");
      link.href = imgUrl;
      link.download = `Tag-${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="main-container">
      <div className="white-card-container">
        
        <div className="left-column no-print">
          <div className="brand-section">
            <img className="com-logo" src="/images/logo.png" alt="Company Logo" />
          </div>

          <div className="form-content">
            {/* BRANCH SELECT */}
            <div className="input-group">
              <div className="label-row">
                <label>Branch:</label>
                <div className="action-btns">
                  <button onClick={() => addNewItem('branches')}>+</button>
                  <button onClick={() => removeItem('branches', formData.branch)}>-</button>
                </div>
              </div>
              <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                <option value="">Select Branch</option>
                {options.branches.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* TYPE SELECT */}
            <div className="input-group">
              <div className="label-row">
                <label>Type:</label>
                <div className="action-btns">
                  <button onClick={() => addNewItem('types')}>+</button>
                  <button onClick={() => removeItem('types', formData.type)}>-</button>
                </div>
              </div>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value, brand: '' })}
              >
                <option value="">Select Type</option>
                {options.types.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* BRAND SELECT (Dependent on Type) */}
            <div className="input-group">
              <div className="label-row">
                <label>Brand:</label>
                <div className="action-btns">
                  <button onClick={() => addNewItem('brands')}>+</button>
                  <button onClick={() => removeItem('brands', formData.brand)}>-</button>
                </div>
              </div>
              <select 
                value={formData.brand} 
                disabled={!formData.type}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              >
                <option value="">{formData.type ? `Select ${formData.type} Brand` : 'Select Type First'}</option>
                {formData.type && (options.brandsByType[formData.type] || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <button onClick={handleGenerate} className="btn-main generate">Generate Barcode</button>
            <button onClick={() => setFormData({ branch: '', type: '', brand: '' })} className="reset-link">Reset Form</button>
          </div>
        </div>

        <div className="right-column">
          <h2 className="preview-title no-print">Print Preview</h2>
          <div className="scroll-area">
            <div className="barcode-preview-area single-view no-print">
              <div className="fixed-wrapper"><svg ref={barcodeRef}></svg></div>
            </div>
            <div className="queue-container">
              <h3 className="queue-header no-print">Print Queue</h3>
              <div className="barcode-list-area">
                {printQueue.length === 0 ? (
                  <p className="empty-msg no-print">No items to print</p>
                ) : (
                  printQueue.map((item) => (
                    <div key={item.id} className="queued-item">
                      <div className="print-item-content" dangerouslySetInnerHTML={{ __html: item.svgHtml }} />
                      <button className="remove-btn no-print" onClick={() => setPrintQueue(printQueue.filter(i => i.id !== item.id))}>×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClearQueue} className="reset-link no-print" style={{ marginBottom: '10px' }}>Clear Queue</button>
          <div className="button-grid no-print">
            <button onClick={() => downloadImage('png')} className="btn-sub secondary">Save PNG</button>
            <button onClick={() => downloadImage('jpeg')} className="btn-sub secondary">Save JPG</button>
            <button onClick={() => window.print()} className="btn-sub print">Print All ({printQueue.length})</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;