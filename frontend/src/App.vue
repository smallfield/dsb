<script setup>
import { ref } from 'vue'

const data = ref(null)
const loading = ref(false)
const error = ref(null)

const fetchData = async () => {
  loading.value = true
  error.value = null
  data.value = null
  
  try {
    const res = await fetch('/departure?path=/departure/%C3%98RE/dinstation/')
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    console.error(e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <h1>DSB Departure Info</h1>
    
    <div class="controls">
      <button @click="fetchData" :disabled="loading" class="fetch-btn">
        {{ loading ? 'Loading...' : 'Get Live Departure Data' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      Error: {{ error }}
    </div>

    <div v-if="data" class="data-display">
      <h2>Departure Data</h2>
      <div class="json-viewer">
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.fetch-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.fetch-btn:hover:not(:disabled) {
  background-color: #3aa876;
}

.fetch-btn:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  background-color: #fcebeb;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 2rem;
}

.data-display {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.json-viewer {
  background-color: #282c34;
  color: #abb2bf;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
}

pre {
  margin: 0;
}
</style>
