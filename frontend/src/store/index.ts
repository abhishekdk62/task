import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import taskFiltersReducer from '@/features/tasks/taskFiltersSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      taskFilters: taskFiltersReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
