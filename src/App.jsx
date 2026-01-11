import { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import './App.css';

function App() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('disposal_options');
    return saved ? JSON.parse(saved) : {
      branches: ["Pasay", "Cebu", "Munoz", "Fairview"],
      types: ["Monitor", "Keyboard", "Mouse", "Ram", "Heatsink"],
      brands: ["AOC", "Gigabyte"]
    };
  });

  const [formData, setFormData] = useState({ branch: '', type: '', brand: '' });
  const [printQueue, setPrintQueue] = useState([]);
  const barcodeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('disposal_options', JSON.stringify(options));
  }, [options]);

  const addNewItem = (category) => {
    const newItem = prompt(`Enter new ${category}:`);
    if (newItem && newItem.trim() !== "") {
      setOptions(prev => ({ ...prev, [category]: [...prev[category], newItem.trim()] }));
    }
  };

  const removeItem = (category, value) => {
    if (!value) return alert("Select an item in the dropdown to remove.");
    if (window.confirm(`Remove "${value}"?`)) {
      setOptions(prev => ({ ...prev, [category]: prev[category].filter(item => item !== value) }));
      const field = category === 'branches' ? 'branch' : category.slice(0, -1);
      setFormData({ ...formData, [field]: '' });
    }
  };

  // Logic to reset the queue
  const handleClearQueue = () => {
    if (printQueue.length === 0) return;
    if (window.confirm("Are you sure you want to clear the entire print queue?")) {
      setPrintQueue([]);
    }
  };

  const handleGenerate = () => {
    const { branch, type, brand } = formData;
    if (!branch || !type || !brand) return alert("Please fill all fields!");

    const displayText = `${branch} - ${brand} - ${type}`;
    const combinedData = displayText.replace(/ - /g, "\t");

    if (barcodeRef.current) {
      barcodeRef.current.innerHTML = "";
      JsBarcode(barcodeRef.current, combinedData, {
        format: "CODE128",
        width: 1.8,
        height: 70,
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

        {/* LEFT COLUMN */}
        <div className="left-column no-print">
          <div className="brand-section">
            <img className="com-logo" src="/images/logo.png" alt="Company Logo" />
          </div>

          <div className="form-content">
            {[
              { label: 'Branch', key: 'branch', cat: 'branches' },
              { label: 'Brand', key: 'brand', cat: 'brands' },
              { label: 'Type', key: 'type', cat: 'types' }
            ].map((item) => (
              <div className="input-group" key={item.key}>
                <div className="label-row">
                  <label>{item.label}:</label>
                  <div className="action-btns">
                    <button onClick={() => addNewItem(item.cat)}>+</button>
                    <button onClick={() => removeItem(item.cat, formData[item.key])}>-</button>
                  </div>
                </div>
                <div className="select-wrapper">
                  <select value={formData[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}>
                    <option value="">Select {item.label}</option>
                    {options[item.cat].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <button onClick={handleGenerate} className="btn-main generate">Generate Barcode</button>
            <button onClick={() => setFormData({ branch: '', type: '', brand: '' })} className="reset-link">Reset Form</button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          <h2 className="preview-title no-print">Print Preview</h2>

          <div className="scroll-area">
            <div className="barcode-preview-area single-view no-print">
              <div className="fixed-wrapper">
                <svg ref={barcodeRef}></svg>
              </div>
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

          {/* ADDED CLEAR QUEUE BUTTON HERE */}
          <button onClick={handleClearQueue} className="reset-link no-print" style={{ marginBottom: '10px' }}>
            Clear Queue
          </button>

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