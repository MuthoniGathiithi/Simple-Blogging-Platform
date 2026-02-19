import React from 'react';
import styles from './Staticphonemockup.module.css';

const StaticPhoneMockup = () => {
  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneNotch}>
        <div className={styles.phoneSpeaker}></div>
        <div className={styles.phoneCamera}></div>
      </div>
      <div className={styles.phoneScreen}>
        <div className={styles.screenContent}>
          <div className={styles.formHeader}>
            <h1>Create New Lesson Plan</h1>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              School Name <span className={styles.required}>*</span>
            </label>
            <input type="text" className={styles.formInput} placeholder="Enter school name" readOnly />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Subject <span className={styles.required}>*</span>
            </label>
            <input type="text" className={styles.formInput} placeholder="e.g. Biology, Geography, Mathematics" readOnly />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Class <span className={styles.required}>*</span>
              </label>
              <input type="text" className={styles.formInput} placeholder="e.g. 10A" readOnly />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Grade</label>
              <select className={styles.formSelect} disabled>
                <option>10</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Term</label>
              <select className={styles.formSelect} disabled>
                <option>1</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date</label>
              <input type="text" className={styles.formInput} defaultValue="01/14/2026" readOnly />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Start Time</label>
              <input type="text" className={styles.formInput} defaultValue="08:00 AM" readOnly />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>End Time</label>
              <input type="text" className={styles.formInput} defaultValue="08:40 AM" readOnly />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Teacher Name <span className={styles.required}>*</span>
              </label>
              <input type="text" className={styles.formInput} placeholder="Enter teacher name" readOnly />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>TSC Number</label>
              <input type="text" className={styles.formInput} placeholder="Enter TSC number" readOnly />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Number of Boys</label>
              <select className={styles.formSelect} disabled>
                <option>0</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Number of Girls</label>
              <select className={styles.formSelect} disabled>
                <option>0</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Strand <span className={styles.required}>*</span>
              </label>
              <input type="text" className={styles.formInput} placeholder="e.g. Biodiversity" readOnly />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Sub-strand <span className={styles.required}>*</span>
              </label>
              <input type="text" className={styles.formInput} placeholder="e.g. Classification" readOnly />
            </div>
          </div>

          <div className={styles.tipBox}>
            <span className={styles.tipIcon}>💡</span>
            <strong>Tip:</strong> The system can handle typos! If you type "Geogrsphy" instead of "Geography", it will automatically match to the correct subject.
          </div>

          <button className={styles.submitButton}>Generate Lesson Plan</button>
        </div>
      </div>
    </div>
  );
};

export default StaticPhoneMockup;