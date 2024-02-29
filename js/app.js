import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "./config.js";

const CLIENT_ID = SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = SPOTIFY_CLIENT_SECRET;

const container = document.querySelector(".container");
const result = document.querySelector("#result");
const form = document.querySelector("#form");

async function getToken() {
  const url = `https://accounts.spotify.com/api/token`;
  const data = {
    grant_type: "client_credentials",
  };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
    },
    body: new URLSearchParams(data),
  };

  const response = await fetch(url, options);
  const dataToken = await response.json();
  return dataToken.access_token;
}

// window.onload = () => {
//   form.addEventListener("submit", SpotifyAPIsearch);
// };

(async function () {
  const accessToken = await getToken();

  form.addEventListener("submit", (event) => {
    SpotifyAPIsearch(event, accessToken);
  });
})();

function SpotifyAPIsearch(event, accessToken) {
  event.preventDefault();

  // Validation
  const artist = document.querySelector("#artist").value;
  if (artist === "") {
    cleanHTML();
    audioStatus.pause();
    showError("Por favor coloca un artista 😒");
    return;
  }

  apiSearch(artist, accessToken);
}

function showError(message) {
  const alert = document.querySelector(".bg-red-100");
  if (!alert) {
    const alert = document.createElement("div");
    alert.classList.add(
      "bg-red-100",
      "text-red-500",
      "mx-auto",
      "mt-6",
      "text-center",
      "px-4",
      "py-3",
      "rounded",
      "max-w-md",
      "mt-6",
      "ease-in",
      "duration-300",
      "transition-all"
    );

    alert.innerHTML = `
    <span class="block">${message}</span>
  `;

    container.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
}

async function apiSearch(artist, accessToken) {
  const url = `https://api.spotify.com/v1/search?q=${artist}&type=track&limit=1`;

  const options = {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  };

  if (audioStatus && !audioStatus.paused) {
    audioStatus.pause();
  }

  loader();

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    cleanHTML();

    if (data.tracks.items.length === 0) {
      showError("No se encontró la canción 😢");
      return;
    }

    showInfo(data);
  } catch (error) {
    showError("Estamos arreglando algunas cosas, intenta nuevamente.😢");
  }
}

function formatDuration(milliseconds) {
  // Convert milliseconds to seconds
  var totalSeconds = Math.floor(milliseconds / 1000);

  // Calculate minutes and seconds
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;

  // Format the time
  var formattedTime =
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");

  return formattedTime;
}

function showInfo(data) {
  const trackName = data.tracks.items[0].name;
  const albumImg = data.tracks.items[0].album.images[0].url;
  const albumName = data.tracks.items[0].album.name;
  const albumType = data.tracks.items[0].album.album_type;
  const artists = data.tracks.items[0].artists;
  const trackDuration = data.tracks.items[0].duration_ms;
  const trackPopularity = data.tracks.items[0].popularity;
  const trackReleaseDate = data.tracks.items[0].album.release_date;
  const playSong = data.tracks.items[0].preview_url;

  const name = document.createElement("p");
  name.innerHTML = `
   ${trackName}
  `;
  name.classList.add("text-2xl", "font-bold");

  const img = document.createElement("img");
  img.src = albumImg;
  img.classList.add("w-64", "h-64", "mx-auto", "rounded");

  const album = document.createElement("p");
  album.innerHTML = ` Álbum: ${albumName} `;
  album.classList.add("text-base");

  const type = document.createElement("p");
  type.innerHTML = ` Tipo: ${capitalize(albumType)} `;

  const artist = document.createElement("p");

  let artistNames = "Artistas: ";

  artists.forEach((artistItem, index) => {
    const artistName = artistItem.name;
    if (index === 0) {
      artistNames += artistName;
    } else {
      artistNames += `, ${artistName}`;
    }
  });

  artist.innerHTML = ` ${artistNames} `;

  const duration = document.createElement("p");
  duration.innerHTML = `Duración: ${formatDuration(trackDuration)}`;

  const popularity = document.createElement("p");
  popularity.innerHTML = `Popularidad: ${trackPopularity}%`;

  const release = document.createElement("p");
  release.innerHTML = `Fecha de lanzamiento: ${trackReleaseDate}`;

  const preview = document.createElement("p");
  preview.innerHTML = "▶️ Reproducir preview";
  preview.classList.add("cursor-pointer", "mt-3", "font-bold", "inline-block");
  if (!playSong) {
    preview.classList.add("opacity-50", "pointer-events-none");
  }
  preview.addEventListener("click", () => {
    if (playSong) {
      playAudioPreview(playSong, preview);
    }
  });

  //

  const resultDiv = document.createElement("div");
  resultDiv.classList.add("grid", "grid-cols-2", "rounded", "gap-8");

  const imgContainer = document.createElement("div");
  imgContainer.classList.add("grid", "justify-end");

  const textContainer = document.createElement("div");

  textContainer.appendChild(name);
  textContainer.appendChild(album);
  textContainer.appendChild(type);
  textContainer.appendChild(artist);
  textContainer.appendChild(duration);
  textContainer.appendChild(release);
  textContainer.appendChild(popularity);
  textContainer.appendChild(preview);
  imgContainer.appendChild(img);
  // resultDiv.appendChild(img);
  resultDiv.appendChild(imgContainer);
  resultDiv.appendChild(textContainer);

  result.appendChild(resultDiv);

  // if (!preview_url) {
  //   showError("No se encontró la canción 😢");
  //   return;
  // }
}

function cleanHTML() {
  while (result.firstChild) {
    result.removeChild(result.firstChild);
  }
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

let audioStatus = null;

function playAudioPreview(audioUrl, button) {
  if (audioStatus && !audioStatus.paused) {
    audioStatus.pause();
    button.innerHTML = "▶️ Reproducir preview";
  } else {
    audioStatus = new Audio(audioUrl);
    audioStatus.play();
    button.innerHTML = "⏹️ Detener preview";

    audioStatus.onended = () => {
      button.innerHTML = "▶️ Reproducir preview";
    };
  }
}

function loader() {
  cleanHTML();
  const divLoader = document.createElement("div");
  divLoader.classList.add("spinner");

  result.appendChild(divLoader);
}
