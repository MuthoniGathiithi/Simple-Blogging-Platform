/*import { supabase } from '../supabaseClient';

// Save a new lesson plan to Supabase
export const saveLessonPlan = async (lessonPlanData) => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Prepare the data for insertion
    const lessonToSave = {
      user_id: user.id,
      title: lessonPlanData.administrativeDetails?.subject || 'Untitled Lesson',
      grade: lessonPlanData.administrativeDetails?.grade || lessonPlanData.grade,
      topic: lessonPlanData.guidingQuestion || 'No topic specified',
      content: lessonPlanData, // Store the entire lesson plan as JSON
      status: 'draft' // or 'published', 'archived', etc.
    };

    const { data, error } = await supabase
      .from('lesson_plans')
      .insert([lessonToSave])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Fetch all lesson plans for the current user
export const fetchLessonPlans = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing lesson plan
export const updateLessonPlan = async (lessonId, updatedData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const updatePayload = {
      title: updatedData.administrativeDetails?.subject || updatedData.title,
      grade: updatedData.administrativeDetails?.grade || updatedData.grade,
      topic: updatedData.guidingQuestion || updatedData.topic,
      content: updatedData,
      status: updatedData.status || 'draft'
    };

    const { data, error } = await supabase
      .from('lesson_plans')
      .update(updatePayload)
      .eq('id', lessonId)
      .eq('user_id', user.id) // Ensure user owns this lesson
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Delete a lesson plan
export const deleteLessonPlan = async (lessonId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user.id); // Ensure user owns this lesson

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Get a single lesson plan by ID
export const getLessonPlanById = async (lessonId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching lesson plan:', error);
    return { success: false, error: error.message };
  }
};*/

import { supabase } from '../supabaseClient';

// Save a new lesson plan to Supabase
export const saveLessonPlan = async (lessonPlanData) => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract the actual lesson plan data
    const plan = lessonPlanData?.lessonPlan || lessonPlanData;
    
    // Prepare the data for insertion with NEW structure
    const lessonToSave = {
      user_id: user.id,
      title: plan?.learningArea || plan?.subject || 'Untitled Lesson',
      grade: plan?.grade || '',
      topic: plan?.strand || plan?.lessonTitle || 'No topic specified',
      content: lessonPlanData, // Store the entire lesson plan as JSON
      status: 'draft'
    };

    console.log('Saving lesson plan:', lessonToSave);

    const { data, error } = await supabase
      .from('lesson_plans')
      .insert([lessonToSave])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Fetch all lesson plans for the current user
export const fetchLessonPlans = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing lesson plan
export const updateLessonPlan = async (lessonId, updatedData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract the actual lesson plan data
    const plan = updatedData?.lessonPlan || updatedData;

    const updatePayload = {
      title: plan?.learningArea || plan?.subject || 'Untitled Lesson',
      grade: plan?.grade || '',
      topic: plan?.strand || plan?.lessonTitle || 'No topic',
      content: updatedData,
      status: updatedData.status || 'draft'
    };

    const { data, error } = await supabase
      .from('lesson_plans')
      .update(updatePayload)
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Delete a lesson plan
export const deleteLessonPlan = async (lessonId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
    return { success: false, error: error.message };
  }
};

// Get a single lesson plan by ID
export const getLessonPlanById = async (lessonId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching lesson plan:', error);
    return { success: false, error: error.message };
  }
};