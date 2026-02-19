import React from 'react';
import styles from './DashboardMockup.module.css';

const DashboardMockup = () => {
  return (
    <div className={styles.mockupContainer}>
      <div className={styles.browserFrame}>
        {/* Dashboard Content */}
        <div className={styles.dashboardWrapper}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.logo}>Funzo Hub</div>
            
            <nav className={styles.navMenu}>
              <div className={styles.navItem}>
                <span className={styles.navIcon}>⊞</span>
                <span>Overview</span>
              </div>
              <div className={`${styles.navItem} ${styles.navItemActive}`}>
                <span className={styles.navIcon}>+</span>
                <span>Create Lesson</span>
              </div>
              <div className={styles.navItem}>
                <div className={styles.navItemWithBadge}>
                  <div>
                    <span className={styles.navIcon}>📋</span>
                    <span>Lesson Archive</span>
                  </div>
                  <span className={styles.badge}>1</span>
                </div>
              </div>
            </nav>

            <div className={styles.logout}>
              <span className={styles.navIcon}>↪</span>
              <span>Log out</span>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            <div className={styles.contentInner}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>SUB-STRAND</h3>
                <div className={styles.inputBox}>
                  Classification
                  <span className={styles.editIcon}>✎</span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>LESSON LEARNING OUTCOMES</h3>
                  <button className={styles.addBtn}>+ Add</button>
                </div>
                <p className={styles.subtitle}>By the end of the lesson, the learner should be able to:</p>
                
                <div className={styles.outcomeItem}>
                  <span className={styles.itemLabel}>a)</span>
                  <div className={styles.outcomeBox}>
                    Analyze various classification systems used for organisms in biodiversity and their significance in environmental understanding.
                    <div className={styles.itemActions}>
                      <span className={styles.editIcon}>✎</span>
                      <span className={styles.deleteIcon}>🗑</span>
                    </div>
                  </div>
                </div>

                <div className={styles.outcomeItem}>
                  <span className={styles.itemLabel}>b)</span>
                  <div className={styles.outcomeBox}>
                    Evaluate the role of taxonomy in classifying living organisms and its impact on ecological research and conservation efforts.
                    <div className={styles.itemActions}>
                      <span className={styles.editIcon}>✎</span>
                      <span className={styles.deleteIcon}>🗑</span>
                    </div>
                  </div>
                </div>

                <div className={styles.outcomeItem}>
                  <span className={styles.itemLabel}>c)</span>
                  <div className={styles.outcomeBox}>
                    Create a classification chart for local flora and fauna, illustrating their characteristics, habitats, and ecological relationships.
                    <div className={styles.itemActions}>
                      <span className={styles.editIcon}>✎</span>
                      <span className={styles.deleteIcon}>🗑</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>KEY INQUIRY QUESTION</h3>
                <div className={styles.inputBox}>
                  How does classification affect our understanding of biodiversity?
                  <span className={styles.editIcon}>✎</span>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>LEARNING RESOURCES</h3>
                <div className={styles.inputBox}>
                  Charts depicting local flora and fauna, Projector for presentations, Classification worksheets for group activities, Field guides on Kenyan ecosystems
                  <span className={styles.editIcon}>✎</span>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>LESSON FLOW</h3>
                <div className={styles.subSection}>
                  <h4 className={styles.subTitle}>Introduction</h4>
                  <div className={styles.flowBox}>
                    Begin with a discussion on local animals. Ask, "How do we group these animals?" to engage learners.
                    <span className={styles.editIcon}>✎</span>
                  </div>
                </div>
                
                <div className={styles.subSection}>
                  <h4 className={styles.subTitle}>Development</h4>
                  <button className={styles.addStepBtn}>+ Add Step</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;