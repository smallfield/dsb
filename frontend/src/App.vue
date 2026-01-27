<script setup></script>

<template>
  <v-app theme="dark">
    <div class="app-container">
      <header>
        <h1>DSB Live Departures</h1>
      </header>

      <main>
        <router-view />
      </main>
    </div>
  </v-app>
</template>

<style>
body {
  margin: 0;
  background-color: #121212;
  color: white;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #1a1a1a;
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #333;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #ecf0f1;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 2px;
}

main {
  flex: 1;
  padding: 2rem;
}

@media (max-width: 600px) {
  main {
    padding: 1rem;
  }
}
</style>
