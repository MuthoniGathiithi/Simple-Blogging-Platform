"use client"

import { useState, useEffect } from "react"
import "./Dashboard.css"
import { getBilingualFields } from "./utils/bilingual"
import { downloadAsPdf } from "./utils/pdf"
import { styles } from "./styles/dashboardStyles"
import { supabase } from "./supabaseClient"
import {
  LayoutDashboard,
  Plus,
  Archive,
  Save,
  ArrowLeft,
  Eye,
  Trash2,
  Search,
  FileText,
  LogOut,
  Download,
  Edit2,
  Check,
  X,
} from "lucide-react"
import { generateLessonPlan } from "./services/api"
import { saveLessonPlan, fetchLessonPlans, updateLessonPlan, deleteLessonPlan } from "./services/lessonPlanService"

export default function LessonCreator() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lessonPlan, setLessonPlan] = useState(null)
  const [currentLessonId, setCurrentLessonId] = useState(null)
  const [savedLessons, setSavedLessons] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLessons, setFilteredLessons] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingValue, setEditingValue] = useState("")
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const [formData, setFormData] = useState({
    schoolName: "",
    subject: "",
    grade: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "08:40",
    boys: "",
    girls: "",
    strand: "",
    subStrand: "",
  })

  useEffect(() => {
    loadLessons()
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "archive") {
      loadLessons()
    }
  }, [activeTab])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLessons(savedLessons)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = savedLessons.filter((lesson) => {
        const fields = getBilingualFields(lesson)
        const learningArea = fields.data.learningArea?.toLowerCase() || ""
        const grade = fields.data.grade?.toString().toLowerCase() || ""
        const strand = fields.data.strand?.toLowerCase() || ""
        const title = fields.data.lessonTitle?.toLowerCase() || ""

        return (
          learningArea.includes(query) ||
          grade.includes(query) ||
          strand.includes(query) ||
          title.includes(query)
        )
      })
      setFilteredLessons(filtered)
    }
  }, [searchQuery, savedLessons])

  const loadLessons = async () => {
    setIsLoadingLessons(true)
    const result = await fetchLessonPlans()
    if (result.success) {
      const lessons = result.data.map((lesson) => {
        const content = typeof lesson.content === "string" ? JSON.parse(lesson.content) : lesson.content
        const normalizedContent = content?.lessonPlan
          ? content
          : {
              lessonPlan: content,
            }

        return {
          ...normalizedContent,
          dbId: lesson.id,
          savedDate: new Date(lesson.created_at).toLocaleDateString(),
          status: lesson.status,
        }
      })
      setSavedLessons(lessons)
      setFilteredLessons(lessons)
    } else {
      alert("Failed to load lessons: " + result.error)
    }
    setIsLoadingLessons(false)
  }
  
  const handleGenerate = async () => {
    // Validate required fields - FIXED for number inputs
    const errors = []
    
    if (!formData.schoolName?.trim()) errors.push("School")
    if (!formData.subject?.trim()) errors.push("Learning Area")
    if (String(formData.grade ?? "").trim() === "") errors.push("Grade")
    if (!formData.date?.trim()) errors.push("Date")
    if (!formData.startTime?.trim()) errors.push("Time")
    if (!formData.strand?.trim()) errors.push("Strand")
    if (!formData.subStrand?.trim()) errors.push("Sub-strand")
    
    if (errors.length > 0) {
      alert(`Please fill in the following required fields:\n- ${errors.join('\n- ')}`)
      return
    }

    setIsGenerating(true)
    try {
      const normalizedFormData = {
        ...formData,
        subject: toSentenceCase(formData.subject),
        strand: toSentenceCase(formData.strand),
        subStrand: toSentenceCase(formData.subStrand),
      }
      const generatedPlan = await generateLessonPlan(normalizedFormData)
      setLessonPlan(generatedPlan)
      setCurrentLessonId(null)
      console.log("Generated lesson plan:", generatedPlan)
    } catch (error) {
      console.error("Error generating lesson plan:", error)
      const message = error?.message ? String(error.message) : String(error)
      alert(`Failed to generate lesson plan:\n${message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const normalizeToStringArray = (value) => {
    if (Array.isArray(value)) return value.map((v) => String(v ?? "").trim()).filter(Boolean)
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return []
      return trimmed
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    }
    if (value == null) return []
    if (typeof value === "object") {
      return Object.values(value)
        .flat()
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
    }
    return [String(value).trim()].filter(Boolean)
  }

  const toSentenceCase = (value) => {
    const s = String(value ?? "").trim()
    if (!s) return ""
    const lower = s.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  const normalizeLessonPlanForSave = (lp) => {
    const clone = typeof structuredClone === "function" ? structuredClone(lp) : JSON.parse(JSON.stringify(lp))
    const plan = clone?.lessonPlan || clone
    
    if (plan) {
      // Normalize arrays
      if (plan.learningResources) {
        plan.learningResources = normalizeToStringArray(plan.learningResources)
      }
      if (plan.keyInquiryQuestions) {
        plan.keyInquiryQuestions = normalizeToStringArray(plan.keyInquiryQuestions)
      }
      if (plan.coreCompetenciesToBeDeveloped) {
        plan.coreCompetenciesToBeDeveloped = normalizeToStringArray(plan.coreCompetenciesToBeDeveloped)
      }
      if (plan.linkToValues) {
        plan.linkToValues = normalizeToStringArray(plan.linkToValues)
      }
      if (plan.linksToPCI) {
        plan.linksToPCI = normalizeToStringArray(plan.linksToPCI)
      }

      // Normalize text fields
      if (plan.learningArea != null) plan.learningArea = toSentenceCase(plan.learningArea)
      if (plan.strand != null) plan.strand = toSentenceCase(plan.strand)
      if (plan.subStrand != null) plan.subStrand = toSentenceCase(plan.subStrand)
    }
    
    return clone
  }

  const handleSave = async () => {
    if (!lessonPlan) return

    setIsSaving(true)
    try {
      let result
      const normalized = normalizeLessonPlanForSave(lessonPlan)
      if (currentLessonId) {
        result = await updateLessonPlan(currentLessonId, normalized)
        if (result.success) {
          alert("Lesson plan updated successfully!")
        }
      } else {
        result = await saveLessonPlan(normalized)
        if (result.success) {
          alert("Lesson plan saved successfully!")
          setCurrentLessonId(result.data.id)
        }
      }

      if (!result.success) {
        alert("Failed to save lesson plan: " + result.error)
      }

      if (activeTab === "archive") {
        await loadLessons()
      }
    } catch (error) {
      console.error("Error saving lesson:", error)
      alert("An error occurred while saving the lesson plan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async (lesson, format = 'pdf') => {
    setIsDownloading(true)
    try {
      const result = await downloadAsPdf(lesson)

      if (result.success) {
        alert(`Lesson plan downloaded successfully as PDF!`)
      } else {
        alert(`Failed to download: ${result.error}`)
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("An error occurred while downloading the lesson plan")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async (lesson) => {
    if (!confirm("Are you sure you want to delete this lesson plan?")) {
      return
    }

    const result = await deleteLessonPlan(lesson.dbId)
    if (result.success) {
      alert("Lesson plan deleted successfully!")
      await loadLessons()
    } else {
      alert("Failed to delete lesson plan: " + result.error)
    }
  }
  
  const handleViewLesson = (lesson) => {
    if (lesson.lessonPlan) {
      setLessonPlan(lesson)
    } else {
      setLessonPlan({
        lessonPlan: lesson,
        dbId: lesson.dbId,
        savedDate: lesson.savedDate,
        status: lesson.status,
      })
    }

    setCurrentLessonId(lesson.dbId)
    setActiveTab("create")
    setIsMobileMenuOpen(false)
  }

  const handleCreateNew = () => {
    setLessonPlan(null)
    setCurrentLessonId(null)
    setEditingField(null)
    setFormData({
      schoolName: "",
      subject: "",
      grade: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "08:40",
      boys: "",
      girls: "",
      strand: "",
      subStrand: "",
    })
  }

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return

    setLessonPlan(null)
    setCurrentLessonId(null)
    setSavedLessons([])
    setFilteredLessons([])
    setActiveTab("dashboard")

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      window.location.href = "/"
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const handleNavClick = (tab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  const startEditing = (field, value) => {
    setEditingField(field)
    setEditingValue(value || "")
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue("")
  }

  const saveEdit = (path) => {
    if (!lessonPlan) return
    
    const newPlan = JSON.parse(JSON.stringify(lessonPlan))
    const keys = path.split('.')
    
    let current = newPlan
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      const nextKey = keys[i + 1]
      
      if (!isNaN(nextKey)) {
        if (!current[key]) current[key] = []
      } else {
        if (!current[key]) current[key] = {}
      }
      current = current[key]
    }
    
    const finalKey = keys[keys.length - 1]
    current[finalKey] = editingValue
    
    setLessonPlan(newPlan)
    setEditingField(null)
    setEditingValue("")
  }

  // ============ NEW STRUCTURE HELPER FUNCTIONS ============
  
  const addLearningOutcome = () => {
    if (!lessonPlan) return
    
    const fields = getBilingualFields(lessonPlan)
    const outcomesData = fields.data.specificLearningOutcomes || { 
      statement: fields.labels.outcomeStatement, 
      outcomes: [] 
    }
    const outcomes = outcomesData.outcomes || []
    
    const newOutcomes = [...outcomes]
    const nextLetter = String.fromCharCode(97 + newOutcomes.length)
    newOutcomes.push({
      id: nextLetter,
      outcome: "New learning outcome - click to edit"
    })
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    if (!plan.specificLearningOutcomes) {
      plan.specificLearningOutcomes = { 
        statement: fields.labels.outcomeStatement, 
        outcomes: [] 
      }
    }
    plan.specificLearningOutcomes.outcomes = newOutcomes
    
    setLessonPlan({...lessonPlan})
  }

  const deleteLearningOutcome = (index) => {
    if (!lessonPlan) return
    
    const fields = getBilingualFields(lessonPlan)
    const outcomesData = fields.data.specificLearningOutcomes || {}
    const outcomes = outcomesData.outcomes || []
    
    const newOutcomes = outcomes.filter((_, i) => i !== index)
    const renumbered = newOutcomes.map((outcome, i) => ({
      ...outcome,
      id: String.fromCharCode(97 + i)
    }))
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    if (plan.specificLearningOutcomes) {
      plan.specificLearningOutcomes.outcomes = renumbered
    }
    
    setLessonPlan({...lessonPlan})
  }

  const addInquiryQuestion = () => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const questions = [...(fields.data.keyInquiryQuestions || [])]
    questions.push("New question - click to edit")
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.keyInquiryQuestions = questions
    setLessonPlan({...lessonPlan})
  }

  const deleteInquiryQuestion = (index) => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const questions = (fields.data.keyInquiryQuestions || []).filter((_, i) => i !== index)
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.keyInquiryQuestions = questions
    setLessonPlan({...lessonPlan})
  }

  const addCoreCompetency = () => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const competencies = [...(fields.data.coreCompetencies || [])]
    competencies.push("New competency - click to edit")
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.coreCompetenciesToBeDeveloped = competencies
    setLessonPlan({...lessonPlan})
  }

  const deleteCoreCompetency = (index) => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const competencies = (fields.data.coreCompetencies || []).filter((_, i) => i !== index)
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.coreCompetenciesToBeDeveloped = competencies
    setLessonPlan({...lessonPlan})
  }

  const addValue = () => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const values = [...(fields.data.linkToValues || [])]
    values.push("New value - click to edit")
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.linkToValues = values
    setLessonPlan({...lessonPlan})
  }

  const deleteValue = (index) => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const values = (fields.data.linkToValues || []).filter((_, i) => i !== index)
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.linkToValues = values
    setLessonPlan({...lessonPlan})
  }

  const addPCI = () => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const pcis = [...(fields.data.linksToPCI || [])]
    pcis.push("New PCI - click to edit")
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.linksToPCI = pcis
    setLessonPlan({...lessonPlan})
  }

  const deletePCI = (index) => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const pcis = (fields.data.linksToPCI || []).filter((_, i) => i !== index)
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    plan.linksToPCI = pcis
    setLessonPlan({...lessonPlan})
  }

  const addExplorationStep = () => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const experiences = fields.data.suggestedLearningExperiences || {}
    const exploration = [...(experiences.exploration || [])]
    exploration.push("Step description - click to edit")
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    if (!plan.suggestedLearningExperiences) plan.suggestedLearningExperiences = {}
    plan.suggestedLearningExperiences.exploration = exploration
    setLessonPlan({...lessonPlan})
  }

  const deleteExplorationStep = (index) => {
    if (!lessonPlan) return
    const fields = getBilingualFields(lessonPlan)
    const experiences = fields.data.suggestedLearningExperiences || {}
    const exploration = (experiences.exploration || []).filter((_, i) => i !== index)
    
    const plan = lessonPlan.lessonPlan || lessonPlan
    if (plan.suggestedLearningExperiences) {
      plan.suggestedLearningExperiences.exploration = exploration
    }
    setLessonPlan({...lessonPlan})
  }

  const renderEditableField = (path, value, multiline = false, placeholder = "Click to edit") => {
    const fieldKey = path
    const isEditing = editingField === fieldKey
    const displayValue = typeof value === "string" ? value.trim() : value
    
    return (
      <div style={styles.editableContainer}>
        {isEditing ? (
          <div style={styles.editingWrapper}>
            {multiline ? (
              <textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                style={styles.editTextarea}
                placeholder={placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEditing()
                }}
              />
            ) : (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                style={styles.editInput}
                placeholder={placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(path)
                  if (e.key === 'Escape') cancelEditing()
                }}
              />
            )}
            <div style={styles.editButtonGroup}>
              <button 
                onClick={() => saveEdit(path)} 
                style={styles.saveEditBtn}
                title="Save (Enter)"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={cancelEditing} 
                style={styles.cancelEditBtn}
                title="Cancel (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            style={styles.editableValue} 
            onClick={() => startEditing(fieldKey, displayValue)}
            title="Click to edit"
          >
            <span style={styles.editableText}>
              {displayValue || placeholder}
            </span>
            <Edit2 size={14} style={styles.editIcon} />
          </div>
        )}
      </div>
    )
  }

  const isMobile = windowWidth <= 768

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-button"
        style={{
          ...styles.mobileMenuButton,
          display: isMobile ? 'block' : 'none'
        }}
        aria-label="Toggle menu"
      >
        <div style={styles.hamburger}>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </div>
      </button>

      <aside 
        className={isMobile ? (isMobileMenuOpen ? 'sidebar-mobile-visible' : 'sidebar-mobile-hidden') : ''}
        style={styles.sidebar}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <div style={styles.logoText}>Funzo Hub</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSection}>
            <button
              onClick={() => handleNavClick("dashboard")}
              style={{
                ...styles.navButton,
                ...(activeTab === "dashboard" ? styles.navButtonActive : {}),
              }}
            >
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleNavClick("create")}
              style={{
                ...styles.navButton,
                ...(activeTab === "create" ? styles.navButtonActive : {}),
              }}
            >
              <Plus size={20} />
              <span>Create Lesson</span>
            </button>

            <button
              onClick={() => handleNavClick("archive")}
              style={{
                ...styles.navButton,
                ...(activeTab === "archive" ? styles.navButtonActive : {}),
              }}
            >
              <Archive size={20} />
              <span>Lesson Archive</span>
              {savedLessons.length > 0 && (
                <span style={styles.badge}>{savedLessons.length}</span>
              )}
            </button>
          </div>

          <div style={styles.navSectionBottom}>
            <div style={styles.dividerLine} />
            <button onClick={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      {isMobileMenuOpen && isMobile && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={styles.mobileOverlay}
        />
      )}

      <main 
        className={isMobile ? 'main-mobile' : ''}
        style={{
          ...styles.main,
          marginLeft: isMobile ? '0' : '260px'
        }}
      >
        <header 
          className={isMobile ? 'top-bar-mobile' : ''}
          style={styles.topBar}
        >
          <div style={styles.topBarLeft}>
            <div style={styles.greeting}>{getGreeting()}</div>
            <h1 
              className={isMobile ? 'page-title-mobile' : ''}
              style={styles.pageTitle}
            >
              {activeTab === "dashboard" && "Overview"}
              {activeTab === "create" && "Lesson Planner"}
              {activeTab === "archive" && "Lesson Archive"}
            </h1>
          </div>

          <div 
            className={isMobile ? 'search-box-mobile' : ''}
            style={styles.topBarRight}
          >
            <div style={styles.searchBox}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
        </header>

        <div 
          className={isMobile ? 'content-mobile' : ''}
          style={styles.content}
        >
          {activeTab === "dashboard" && (
            <div style={styles.dashboardLayout}>
              <div 
                className={isMobile ? 'stats-row-mobile' : ''}
                style={styles.statsRow}
              >
                <div style={{...styles.statCard, ...styles.statCardBlue}}>
                  <div style={styles.statHeader}>
                    <div style={styles.statIcon}>
                      <FileText size={24} />
                    </div>
                  </div>
                  <div style={styles.statValue}>{savedLessons.length.toLocaleString()}</div>
                  <div style={styles.statSubtext}>Total Lessons</div>
                </div>

                <div style={{...styles.statCard, ...styles.statCardPurple}}>
                  <div style={styles.statHeader}>
                    <div style={styles.statIcon}>
                      <Archive size={24} />
                    </div>
                  </div>
                  <div style={styles.statValue}>
                    {savedLessons.filter((l) => {
                      const lessonDate = new Date(l.savedDate)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return lessonDate >= weekAgo
                    }).length.toLocaleString()}
                  </div>
                  <div style={styles.statSubtext}>This Week</div>
                </div>
              </div>

              <div style={styles.lessonsSection}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Recent Lessons</h2>
                  <div style={{ ...styles.sectionHeaderActions, ...(isMobile ? styles.sectionHeaderActionsMobile : {}) }}>
                    <button
                      onClick={() => {
                        handleCreateNew()
                        setActiveTab("create")
                      }}
                      style={styles.createPlanButton}
                    >
                      <Plus size={16} />
                      <span>Create New Plan</span>
                    </button>
                    <button onClick={() => setActiveTab("archive")} style={styles.viewAllButton}>
                      View All
                    </button>
                  </div>
                </div>

                <div style={styles.tableContainer}>
                  {filteredLessons.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyText}>
                        {searchQuery ? "No lessons match your search" : "No lessons yet"}
                      </div>
                      <p style={styles.emptyDescription}>
                        {searchQuery
                          ? "Try a different search term"
                          : "Create your first lesson plan to get started"}
                      </p>
                    </div>
                  ) : (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHeader}>
                            <th style={{ ...styles.th, textAlign: "left" }}>Learning Area</th>
                            <th style={{ ...styles.th, textAlign: "left" }}>Grade</th>
                            <th style={{ ...styles.th, textAlign: "left" }}>Strand</th>
                            <th style={{ ...styles.th, textAlign: "left" }}>Date</th>
                            <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLessons.slice(0, 5).map((lesson) => {
                            const fields = getBilingualFields(lesson)
                            return (
                              <tr key={lesson.dbId} style={styles.tableRow}>
                                <td style={styles.td}>
                                  {fields.data.learningArea || fields.data.lessonTitle?.substring(0, 30) || "Lesson Plan"}
                                </td>
                                <td style={styles.td}>{fields.data.grade || "N/A"}</td>
                                <td style={styles.td}>{fields.data.strand || "N/A"}</td>
                                <td style={styles.td}>{lesson.savedDate}</td>
                                <td style={styles.td}>
                                  <div style={styles.actionButtonGroup}>
                                    <button onClick={() => handleViewLesson(lesson)} style={styles.viewButtonSmall}>
                                      <Eye size={16} />
                                      <span>View</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDownload(lesson, 'pdf')} 
                                      style={styles.downloadButtonSmall}
                                      disabled={isDownloading}
                                      title="Download as PDF"
                                    >
                                      <Download size={16} />
                                      <span>PDF</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(lesson)} 
                                      style={styles.deleteButtonSmall}
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <>
              {!lessonPlan ? (
                <div style={styles.formCard}>
                  <h2 style={styles.formTitle}>Create New Lesson Plan</h2>
                  <div style={styles.formGrid}>
                    {[
                      { label: "School", key: "schoolName", placeholder: "Enter school name", type: "text", required: true },
                      { label: "Learning Area", key: "subject", placeholder: "e.g. Biology, Geography, Mathematics", type: "text", required: true },
                      { label: "Grade", key: "grade", placeholder: "e.g. 10", type: "number", required: true },
                      { label: "Date", key: "date", placeholder: "", type: "date", required: true },
                      { label: "Time", key: "startTime", placeholder: "e.g. 08:00", type: "time", required: true },
                      { label: "Roll - Boys", key: "boys", placeholder: "0", type: "number", required: true },
                      { label: "Roll - Girls", key: "girls", placeholder: "0", type: "number", required: true },
                      { label: "Strand", key: "strand", placeholder: "e.g. Biodiversity", type: "text", required: true },
                      { label: "Sub-strand", key: "subStrand", placeholder: "e.g. Classification", type: "text", required: true },
                    ].map((field) => (
                      <div key={field.key} style={styles.fieldWrapper}>
                        <label style={styles.label}>
                          {field.label}
                          {field.required && (
                            <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
                          )}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key] ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.key]:
                                field.type === "number" ? e.target.value : e.target.value,
                            }))
                          }
                          style={{
                            ...styles.input,
                            ...(field.required && (
                              field.type === 'number' 
                                ? (formData[field.key] === "" || formData[field.key] === null || formData[field.key] === undefined)
                                : !formData[field.key]?.trim()
                            ) ? { borderColor: "#fca5a5" } : {})
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "14px", color: "#0369a1" }}>
                    💡 <strong>Tip:</strong> For Kiswahili lessons, enter "Kiswahili" in the Learning Area field to get full Kiswahili output with subject-specific terminology!
                  </div>
                  
                  <button onClick={handleGenerate} disabled={isGenerating} style={styles.generateButton}>
                    {isGenerating ? "Generating Lesson Plan..." : "Generate Lesson Plan"}
                  </button>
                </div>
              ) : (
                <div style={styles.documentContainer}>
                  <div 
                    className={isMobile ? 'action-bar-mobile' : ''}
                    style={styles.actionBar}
                  >
                    <button onClick={handleCreateNew} style={styles.backButton}>
                      <ArrowLeft size={16} />
                      <span>New Plan</span>
                    </button>
                    <div 
                      className={isMobile ? 'action-bar-right-mobile' : ''}
                      style={styles.actionBarRight}
                    >
                      <button 
                        onClick={() => handleDownload(lessonPlan, 'pdf')} 
                        disabled={isDownloading}
                        style={styles.pdfButton}
                      >
                        <Download size={16} />
                        <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
                      </button>
                      <button onClick={handleSave} disabled={isSaving} style={styles.saveButton}>
                        <Save size={16} />
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                      </button>
                    </div>
                  </div>

                  <div 
                    className={isMobile ? 'document-page-mobile' : ''}
                    style={styles.documentPage}
                  >
                    {(() => {
                      const fields = getBilingualFields(lessonPlan)
                      const { isKiswahili, labels, data } = fields

                      return (
                        <>
                          <div style={styles.docHeader}>
                            <div style={styles.docTitle}>{isKiswahili ? "MPANGO WA SOMO" : "LESSON PLAN"}</div>
                            <div style={styles.docDivider}></div>
                          </div>

                          {/* BASIC INFORMATION */}
                          <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>{isKiswahili ? "TAARIFA ZA MSINGI" : "BASIC INFORMATION"}</h3>
                            <table className={isMobile ? 'doc-table-mobile' : ''} style={styles.docTable}>
                              <tbody>
                                <tr>
                                  <td style={styles.tableLabelCell}>{labels.school}:</td>
                                  <td style={styles.tableValueCell}>
                                    {renderEditableField("lessonPlan.school", data.school)}
                                  </td>
                                  <td style={styles.tableLabelCell}>{labels.learningArea}:</td>
                                  <td style={styles.tableValueCell}>
                                    {renderEditableField("lessonPlan.learningArea", data.learningArea)}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={styles.tableLabelCell}>{labels.grade}:</td>
                                  <td style={styles.tableValueCell}>
                                    {renderEditableField("lessonPlan.grade", data.grade?.toString())}
                                  </td>
                                  <td style={styles.tableLabelCell}>{labels.date}:</td>
                                  <td style={styles.tableValueCell}>
                                    {renderEditableField("lessonPlan.date", data.date)}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={styles.tableLabelCell}>{labels.time}:</td>
                                  <td style={styles.tableValueCell}>
                                    {renderEditableField("lessonPlan.time", data.time)}
                                  </td>
                                  <td style={styles.tableLabelCell}>{labels.roll}:</td>
                                  <td style={styles.tableValueCell}>
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                      <span>{labels.boys}: {renderEditableField("lessonPlan.roll.boys", String(data.roll?.boys || 0))}</span>
                                      <span>{labels.girls}: {renderEditableField("lessonPlan.roll.girls", String(data.roll?.girls || 0))}</span>
                                      <span>{labels.total}: {data.roll?.total || 0}</span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* STRAND */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.strand}</div>
                            {renderEditableField("lessonPlan.strand", data.strand, false, "Enter strand")}
                          </div>

                          {/* SUB-STRAND */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.subStrand}</div>
                            {renderEditableField("lessonPlan.subStrand", data.subStrand, false, "Enter sub-strand")}
                          </div>

                          {/* LESSON TITLE */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.lessonTitle}</div>
                            {renderEditableField("lessonPlan.lessonTitle", data.lessonTitle, false, "Enter lesson title")}
                          </div>

                          {/* SPECIFIC LEARNING OUTCOMES */}
                          <div style={styles.section}>
                            <div style={styles.sectionHeaderWithButton}>
                              <div style={styles.sectionTitle}>{labels.specificLearningOutcomes}</div>
                              <button onClick={addLearningOutcome} style={styles.addButton} title="Add outcome">
                                <Plus size={16} />
                                <span>Add</span>
                              </button>
                            </div>
                            <div style={{ fontStyle: 'italic', marginBottom: '12px', fontSize: '12px' }}>
                              {data.specificLearningOutcomes?.statement || labels.outcomeStatement}
                            </div>
                            {(data.specificLearningOutcomes?.outcomes || []).map((outcome, index) => (
                              <div key={index} style={styles.outcomeItem}>
                                <div style={styles.outcomeNumber}>{outcome.id || String.fromCharCode(97 + index)})</div>
                                <div style={styles.outcomeContent}>
                                  {renderEditableField(`lessonPlan.specificLearningOutcomes.outcomes.${index}.outcome`, outcome.outcome || outcome.text, true, "Enter outcome")}
                                </div>
                                <button 
                                  onClick={() => deleteLearningOutcome(index)} 
                                  style={styles.deleteButton}
                                  title="Delete outcome"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* KEY INQUIRY QUESTIONS */}
                          <div style={styles.section}>
                            <div style={styles.sectionHeaderWithButton}>
                              <div style={styles.sectionTitle}>{labels.keyInquiryQuestions}</div>
                              <button onClick={addInquiryQuestion} style={styles.addButton} title="Add question">
                                <Plus size={16} />
                                <span>Add</span>
                              </button>
                            </div>
                            {(data.keyInquiryQuestions || []).map((question, index) => (
                              <div key={index} style={styles.outcomeItem}>
                                <div style={styles.outcomeNumber}>{index + 1})</div>
                                <div style={styles.outcomeContent}>
                                  {renderEditableField(`lessonPlan.keyInquiryQuestions.${index}`, question, false, "Enter question")}
                                </div>
                                <button 
                                  onClick={() => deleteInquiryQuestion(index)} 
                                  style={styles.deleteButton}
                                  title="Delete question"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* CORE COMPETENCIES */}
                          <div style={styles.section}>
                            <div style={styles.sectionHeaderWithButton}>
                              <div style={styles.sectionTitle}>{labels.coreCompetencies}</div>
                              <button onClick={addCoreCompetency} style={styles.addButton} title="Add competency">
                                <Plus size={16} />
                                <span>Add</span>
                              </button>
                            </div>
                            {(data.coreCompetencies || []).map((competency, index) => (
                              <div key={index} style={styles.listItem}>
                                <span>• </span>
                                <div style={{ flex: 1 }}>
                                  {renderEditableField(`lessonPlan.coreCompetenciesToBeDeveloped.${index}`, competency, false, "Enter competency")}
                                </div>
                                <button 
                                  onClick={() => deleteCoreCompetency(index)} 
                                  style={styles.deleteButton}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* LINK TO VALUES */}
                          <div style={styles.section}>
                            <div style={styles.sectionHeaderWithButton}>
                              <div style={styles.sectionTitle}>{labels.linkToValues}</div>
                              <button onClick={addValue} style={styles.addButton} title="Add value">
                                <Plus size={16} />
                                <span>Add</span>
                              </button>
                            </div>
                            {(data.linkToValues || []).map((value, index) => (
                              <div key={index} style={styles.listItem}>
                                <span>• </span>
                                <div style={{ flex: 1 }}>
                                  {renderEditableField(`lessonPlan.linkToValues.${index}`, value, false, "Enter value")}
                                </div>
                                <button 
                                  onClick={() => deleteValue(index)} 
                                  style={styles.deleteButton}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* LINKS TO PCI */}
                          <div style={styles.section}>
                            <div style={styles.sectionHeaderWithButton}>
                              <div style={styles.sectionTitle}>{labels.linksToPCI}</div>
                              <button onClick={addPCI} style={styles.addButton} title="Add PCI">
                                <Plus size={16} />
                                <span>Add</span>
                              </button>
                            </div>
                            {(data.linksToPCI || []).map((pci, index) => (
                              <div key={index} style={styles.listItem}>
                                <span>• </span>
                                <div style={{ flex: 1 }}>
                                  {renderEditableField(`lessonPlan.linksToPCI.${index}`, pci, false, "Enter PCI")}
                                </div>
                                <button 
                                  onClick={() => deletePCI(index)} 
                                  style={styles.deleteButton}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* LEARNING RESOURCES */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.learningResources}</div>
                            {renderEditableField("lessonPlan.learningResources", normalizeToStringArray(data.learningResources).join(", "), true, "Enter resources (comma-separated)")}
                          </div>

                          {/* SUGGESTED LEARNING EXPERIENCES */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.suggestedLearningExperiences}</div>

                            {/* i) Introduction */}
                            <div style={styles.subsection}>
                              <div style={styles.subsectionTitle}>i) {labels.introduction}</div>
                              {renderEditableField("lessonPlan.suggestedLearningExperiences.introduction", data.suggestedLearningExperiences?.introduction, true, "Enter introduction")}
                            </div>

                            {/* ii) Exploration/Development */}
                            <div style={styles.subsection}>
                              <div style={styles.sectionHeaderWithButton}>
                                <div style={styles.subsectionTitle}>ii) {labels.exploration}</div>
                                <button onClick={addExplorationStep} style={styles.addButton} title="Add step">
                                  <Plus size={16} />
                                  <span>Add Step</span>
                                </button>
                              </div>
                              {(data.suggestedLearningExperiences?.exploration || []).map((step, index) => (
                                <div key={index} style={styles.stepBlock}>
                                  <div style={styles.stepHeader}>
                                    <div style={styles.stepTitleText}>{labels.step} {index + 1}</div>
                                    <button 
                                      onClick={() => deleteExplorationStep(index)} 
                                      style={styles.deleteButton}
                                      title="Delete step"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div style={styles.stepField}>
                                    {renderEditableField(`lessonPlan.suggestedLearningExperiences.exploration.${index}`, typeof step === "string" ? step : step?.description || step?.text, true, "Enter step description")}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* iii) Reflection */}
                            <div style={styles.subsection}>
                              <div style={styles.subsectionTitle}>iii) {labels.reflection}</div>
                              {renderEditableField("lessonPlan.suggestedLearningExperiences.reflection", data.suggestedLearningExperiences?.reflection, true, "Enter reflection")}
                            </div>

                            {/* iv) Extension */}
                            <div style={styles.subsection}>
                              <div style={styles.subsectionTitle}>iv) {labels.extension}</div>
                              {renderEditableField("lessonPlan.suggestedLearningExperiences.extension", data.suggestedLearningExperiences?.extension, true, "Enter extension")}
                            </div>
                          </div>

                          {/* PARENTAL INVOLVEMENT */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.parentalInvolvement}</div>
                            {renderEditableField("lessonPlan.suggestedParentalInvolvement", data.parentalInvolvement, true, "Enter parental involvement/community service learning")}
                          </div>

                          {/* SELF EVALUATION */}
                          <div style={styles.section}>
                            <div style={styles.sectionTitle}>{labels.selfEvaluation}</div>
                            {renderEditableField("lessonPlan.selfEvaluationMarks", data.selfEvaluation, true, "Enter self-evaluation criteria")}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "archive" && (
            <>
              {isLoadingLessons ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyText}>Loading lessons...</div>
                </div>
              ) : filteredLessons.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📁</div>
                  <div style={styles.emptyText}>
                    {searchQuery ? "No lessons match your search" : "No Saved Lessons Yet"}
                  </div>
                  <p style={styles.emptyDescription}>
                    {searchQuery
                      ? "Try a different search term"
                      : "Create and save lesson plans to see them here."}
                  </p>
                </div>
              ) : (
                <div 
                  className={isMobile ? 'lesson-grid-mobile' : ''}
                  style={styles.lessonGrid}
                >
                  {filteredLessons.map((lesson) => {
                    const fields = getBilingualFields(lesson)
                    const { labels } = fields
                    
                    return (
                      <div key={lesson.dbId} style={styles.lessonCard}>
                        <div style={styles.lessonCardHeader}>
                          <FileText size={24} style={styles.lessonCardIcon} />
                        </div>
                        <div style={styles.lessonCardTitle}>
                          {fields.data.learningArea || fields.data.lessonTitle?.substring(0, 50) || "Untitled"}
                        </div>
                        <div style={styles.lessonCardMeta}>
                          <div style={styles.metaRow}>
                            <span style={styles.metaLabel}>{labels.grade}:</span>
                            <span style={styles.metaValue}>{fields.data.grade || "N/A"}</span>
                          </div>
                          <div style={styles.metaRow}>
                            <span style={styles.metaLabel}>{labels.strand}:</span>
                            <span style={styles.metaValue}>{fields.data.strand || "N/A"}</span>
                          </div>
                          <div style={styles.metaRow}>
                            <span style={styles.metaLabel}>{labels.date}:</span>
                            <span style={styles.metaValue}>{lesson.savedDate}</span>
                          </div>
                        </div>
                        <div style={styles.lessonCardActions}>
                          <button onClick={() => handleViewLesson(lesson)} style={styles.viewButton}>
                            <Eye size={16} />
                            <span>View</span>
                          </button>
                          <button 
                            onClick={() => handleDownload(lesson, 'pdf')} 
                            style={styles.downloadButtonCard}
                            disabled={isDownloading}
                          >
                            <Download size={16} />
                            <span>PDF</span>
                          </button>
                          <button onClick={() => handleDelete(lesson)} style={styles.deleteButtonCard}>
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}