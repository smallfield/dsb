<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { STATIONS } from "../master/stations";

const route = useRoute();
const router = useRouter();

// Timezone Helpers
const cphFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Copenhagen",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
});

const getCopenhagenNow = () => {
  const parts = cphFormatter.formatToParts(new Date());
  const getPart = (type) =>
    parseInt(parts.find((p) => p.type === type).value, 10);
  return new Date(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second"),
  );
};

// State
const stationA = ref(route.params.stationA || "KH");
const stationB = ref(route.params.stationB || "ØRE");
const departuresA = ref(null);
const departuresB = ref(null);
const loading = ref(false);
const error = ref(null);
const now = ref(getCopenhagenNow());
let timer = null;

// Station Data
const stationOptions = computed(() => {
  const searchableStations = STATIONS.filter((s) => s.searchable);
  return Array.from(
    new Map(searchableStations.map((s) => [s.key, s])).values(),
  );
});

const getStationName = (id) => {
  const station = STATIONS.find((s) => s.key === id);
  return station ? station.value : id;
};

const getDepertureTime = (train) => {
  return train.EstimatedTimeDeparture === "01-01-0001 00:00:00"
    ? train.ScheduleTimeDeparture
    : train.EstimatedTimeDeparture;
};

// Date/Time Helpers
const parseDate = (str) => {
  // Format: "DD-MM-YYYY HH:mm:ss"
  if (!str) return null;
  const [datePart, timePart] = str.split(" ");
  const [day, month, year] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");
  return new Date(year, month - 1, day, hour, minute, second);
};

const getRelativeTime = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return "";

  const diffMs = date - now.value;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return "Departed";
  if (diffSecs >= 0 && diffSecs < 60) return `${diffSecs} s`; // Show seconds if within 1 minute
  if (diffMins < 60) return `${diffMins} min`;

  // Return HH:MM for later trains
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatTime = (dateStr) => {
  const date = parseDate(dateStr);
  return date
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
};

// Logic to check if a train stops at a specific station
const trainStopsAt = (train, destinationStationId) => {
  if (!train.Routes) return false;
  return train.Routes.some(
    (route) =>
      route.Stations &&
      route.Stations.some((s) => s.StationId === destinationStationId),
  );
};

// Filtered Computed Properties
const trainsAtoB = computed(() => {
  if (!departuresA.value?.Trains) return [];
  return departuresA.value.Trains.filter((train) =>
    trainStopsAt(train, stationB.value),
  );
});

const trainsBtoA = computed(() => {
  if (!departuresB.value?.Trains) return [];
  return departuresB.value.Trains.filter((train) =>
    trainStopsAt(train, stationA.value),
  );
});

// Fetching Data
const fetchDepartures = async () => {
  loading.value = true;
  error.value = null;

  try {
    const [resA, resB] = await Promise.all([
      fetch(`/departure?path=/departure/${stationA.value}/dinstation/`),
      fetch(`/departure?path=/departure/${stationB.value}/dinstation/`),
    ]);

    if (!resA.ok)
      throw new Error(
        `Failed to fetch ${getStationName(stationA.value)}: ${resA.status}`,
      );
    if (!resB.ok)
      throw new Error(
        `Failed to fetch ${getStationName(stationB.value)}: ${resB.status}`,
      );

    const dataA = await resA.json();
    const dataB = await resB.json();

    // Handle nested structure if necessary (based on API viewing earlier)
    departuresA.value = dataA.data || dataA;
    departuresB.value = dataB.data || dataB;
  } catch (e) {
    console.error(e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Initial fetch called via watcher or manually if desired, but here we let the watcher handle it if we set immediate,
  // OR we just call it once here and let watchers handle updates.
  // Ideally, initializing the route will trigger the component creation.
  fetchDepartures();

  timer = setInterval(() => {
    now.value = getCopenhagenNow();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

watch(
  () => route.params,
  (newParams) => {
    if (newParams.stationA && newParams.stationB) {
      stationA.value = newParams.stationA;
      stationB.value = newParams.stationB;
      fetchDepartures();
    }
  },
);

watch([stationA, stationB], ([newA, newB]) => {
  if (newA !== route.params.stationA || newB !== route.params.stationB) {
    router.replace({
      name: "TrainBoard",
      params: { stationA: newA, stationB: newB },
    });
  }
});
</script>

<template>
  <v-card>
    <v-card-title>Train Board</v-card-title>
    <v-container fluid>
      <v-row>
        <v-col cols="4">
          <v-autocomplete
            v-model="stationA"
            :items="stationOptions"
            item-title="value"
            item-value="key"
            label="Station A"
            hide-details
            density="compact"
          ></v-autocomplete>
        </v-col>
        <v-col cols="auto">
          <span class="arrow">↔</span>
        </v-col>
        <v-col cols="4">
          <v-autocomplete
            v-model="stationB"
            :items="stationOptions"
            item-title="value"
            item-value="key"
            label="Station B"
            hide-details
            density="compact"
          ></v-autocomplete>
        </v-col>
        <v-col cols="auto">
          <button
            @click="fetchDepartures"
            :disabled="loading"
            class="refresh-btn"
          >
            {{ loading ? "Updating..." : "Refresh Board" }}
          </button>
        </v-col>
      </v-row>
    </v-container>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div class="board-container">
      <!-- Table A to B -->
      <div class="board-column">
        <h2 class="direction-header">
          <span class="station-code">{{ getStationName(stationA) }}</span>
          <span class="to-arrow">→</span>
          <span class="station-code">{{ getStationName(stationB) }}</span>
        </h2>

        <div class="table-wrapper">
          <table class="departure-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Train</th>
                <th>To</th>
                <th>Plat.</th>
                <th style="text-align: right">Dep.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="train in trainsAtoB"
                :key="train.TrainId"
                :class="{ cancelled: train.IsCancelled }"
              >
                <td class="time-cell">
                  {{ formatTime(getDepertureTime(train)) }}
                </td>
                <td class="train-cell">
                  <div class="train-type">{{ train.PublicTrainId }}</div>
                </td>
                <td class="dest-cell">
                  {{
                    getStationName(train.Routes?.[0]?.DestinationStationId) ||
                    "Unknown"
                  }}
                </td>
                <td class="platform-cell">{{ train.TrackCurrent }}</td>
                <td
                  class="countdown-cell"
                  :class="{
                    now: getRelativeTime(getDepertureTime(train)) === 'Now',
                  }"
                >
                  {{
                    train.IsCancelled
                      ? "Cancelled"
                      : getRelativeTime(getDepertureTime(train))
                  }}
                </td>
              </tr>
              <tr v-if="trainsAtoB.length === 0 && !loading">
                <td colspan="5" class="empty-state">No trains found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table B to A -->
      <div class="board-column">
        <h2 class="direction-header">
          <span class="station-code">{{ getStationName(stationB) }}</span>
          <span class="to-arrow">→</span>
          <span class="station-code">{{ getStationName(stationA) }}</span>
        </h2>

        <div class="table-wrapper">
          <table class="departure-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Train</th>
                <th>To</th>
                <th>Plat.</th>
                <th style="text-align: right">Dep.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="train in trainsBtoA"
                :key="train.TrainId"
                :class="{ cancelled: train.IsCancelled }"
              >
                <td class="time-cell">
                  {{ formatTime(getDepertureTime(train)) }}
                </td>
                <td class="train-cell">
                  <div class="train-type">{{ train.PublicTrainId }}</div>
                </td>
                <td class="dest-cell">
                  {{
                    getStationName(train.Routes?.[0]?.DestinationStationId) ||
                    "Unknown"
                  }}
                </td>
                <td class="platform-cell">{{ train.TrackCurrent }}</td>
                <td
                  class="countdown-cell"
                  :class="{
                    now: getRelativeTime(getDepertureTime(train)) === 'Now',
                  }"
                >
                  {{
                    train.IsCancelled
                      ? "Cancelled"
                      : getRelativeTime(getDepertureTime(train))
                  }}
                </td>
              </tr>
              <tr v-if="trainsBtoA.length === 0 && !loading">
                <td colspan="5" class="empty-state">No trains found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.train-board {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #fff;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.station-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.station-autocomplete {
  width: 250px;
}

.arrow {
  font-size: 1.5rem;
  color: #aaa;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  height: 48px;
}

.refresh-btn:hover {
  background: #2980b9;
}

.refresh-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.board-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.board-column {
  background: #2c3e50;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.direction-header {
  background: #1a252f;
  margin: 0;
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid #34495e;
  font-size: 1.5rem;
}

.station-code {
  color: #f1c40f;
  font-weight: bold;
}

.to-arrow {
  margin: 0 0.5rem;
  color: #7f8c8d;
}

.table-wrapper {
  overflow-x: auto;
}

.departure-table {
  width: 100%;
  border-collapse: collapse;
}

.departure-table th {
  background: #34495e;
  padding: 0.3rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.departure-table td {
  padding: 0.7rem 0.3rem;
  border-bottom: 1px solid #34495e;
}

.time-cell {
  font-weight: bold;
  color: #ecf0f1;
}

.train-type {
  background: #e74c3c;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  display: inline-block;
}

.dest-cell {
  color: #ecf0f1;
}

.platform-cell {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: #f1c40f;
}

.countdown-cell {
  text-align: right;
  font-weight: bold;
  color: #2ecc71;
}

.countdown-cell.now {
  color: #e74c3c;
  animation: blink 1s infinite;
}

.cancelled {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  text-decoration: line-through;
}

.cancelled .time-cell,
.cancelled .dest-cell,
.cancelled .platform-cell,
.cancelled .countdown-cell {
  color: #e74c3c;
}

.cancelled .train-type {
  text-decoration: none;
  /* Keep train number readable? User asked for line-through row, usually implies text too */
  background: #c0392b;
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #bdc3c7;
  font-style: italic;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .board-container {
    grid-template-columns: 1fr;
  }
}
</style>
