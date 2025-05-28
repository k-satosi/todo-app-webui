import { format } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

export interface TaskRequest {
  title: string;
  dueDate: Date;
  completed: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const formatDateForApi = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
};

const parseDateFromApi = (task: any): Task => {
  return {
    ...task,
    dueDate: new Date(task.dueDate)
  };
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    const data = await handleResponse<any[]>(response);
    return (data || []).map(parseDateFromApi);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTask = async (id: string): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    const data = await handleResponse<any>(response);
    return parseDateFromApi(data);
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    throw error;
  }
};

export const createTask = async (taskRequest: TaskRequest): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...taskRequest,
        dueDate: formatDateForApi(taskRequest.dueDate),
      }),
    });
    const data = await handleResponse<any>(response);
    return parseDateFromApi(data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (id: string, taskRequest: TaskRequest): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...taskRequest,
        dueDate: formatDateForApi(taskRequest.dueDate),
      }),
    });
    const data = await handleResponse<any>(response);
    return parseDateFromApi(data);
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
};
