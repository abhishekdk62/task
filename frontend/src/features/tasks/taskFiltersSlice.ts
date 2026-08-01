import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TaskFilters } from '@/types';

const initialState: TaskFilters = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  priority: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const taskFiltersSlice = createSlice({
  name: 'taskFilters',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      Object.assign(state, action.payload);
      if (!('page' in action.payload)) {
        state.page = 1;
      }
    },
    resetFilters: () => initialState,
  },
});

export const { setFilters, resetFilters } = taskFiltersSlice.actions;
export default taskFiltersSlice.reducer;
