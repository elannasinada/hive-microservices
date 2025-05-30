# Task Filtering Issues

There appears to be a mismatch between how tasks are being filtered between the overview and Tasks tab. Here are some possible issues:

## Possible Problems

1. **Type mismatch between Java and TypeScript**:
   - In Java: `taskId` is a `Long` type
   - In TypeScript: may be comparing as string vs number

2. **Project ID comparison issue**:
   - Tasks might have project ID in a different property than expected
   - The comparison `task.projectId !== activeProject.projectId` might be failing

3. **Debugging steps**:
   
   Add these logs in your TeamDashboard.tsx file:

   ```typescript
   // At the beginning of the component, after state definitions
   console.log('[DEBUG] Component rendered with activeProject:', activeProject);

   // In the useEffect where tasks are fetched
   console.log('[DEBUG] Tasks fetched:', tasks);
   console.log('[DEBUG] Sample task fields:', tasks.length > 0 ? {
     taskId: tasks[0].taskId,
     taskName: tasks[0].taskName,
     projectId: tasks[0].projectId,
     activeProjectId: activeProject?.projectId
   } : 'No tasks');

   // Just before the filteredTasks definition
   console.log('[DEBUG] About to filter tasks with myTasks length:', myTasks.length);
   if (myTasks.length > 0) {
     console.log('[DEBUG] Example task from myTasks:', {
       taskId: myTasks[0].taskId,
       taskName: myTasks[0].taskName,
       projectId: myTasks[0].projectId,
       taskIdType: typeof myTasks[0].projectId,
       activeProjectId: activeProject?.projectId,
       activeProjectIdType: typeof activeProject?.projectId
     });
   }

   // After filtering
   console.log('[DEBUG] Filtered tasks count:', filteredTasks.length);
   ```

## Fix recommendations:

1. **Fix type comparison**:
   ```typescript
   // Convert to same type before comparing
   if (activeProject && String(task.projectId) !== String(activeProject.projectId)) {
     return false;
   }
   ```

2. **Check if projectId is nested in a sub-object**:
   ```typescript
   // Check for nested projectId property
   if (activeProject && 
       (task.projectId !== activeProject.projectId) && 
       (task.project?.id !== activeProject.projectId)) {
     return false;
   }
   ```

3. **Log tasks displayed in Overview vs Tasks tab to identify differences**

4. **Check task object structure to ensure projectId is correctly identified**
