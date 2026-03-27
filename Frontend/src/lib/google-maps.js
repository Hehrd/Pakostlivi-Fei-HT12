const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_VERSION = "weekly";

function installGoogleMapsLoader() {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only load in the browser.");
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the frontend env.");
  }

  if (window.google?.maps?.importLibrary) {
    return;
  }

  const googleNamespace = (window.google = window.google || {});
  const mapsNamespace = (googleNamespace.maps = googleNamespace.maps || {});

  let loaderPromise = null;
  const requestedLibraries = new Set();

  const injectScript = () =>
    loaderPromise ||
    (loaderPromise = new Promise((resolve, reject) => {
      const params = new URLSearchParams();
      const script = document.createElement("script");

      params.set("libraries", [...requestedLibraries].join(","));
      params.set("key", GOOGLE_MAPS_API_KEY);
      params.set("v", GOOGLE_MAPS_VERSION);
      params.set("loading", "async");
      params.set("callback", "google.maps.__ib__");

      mapsNamespace.__ib__ = resolve;
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => reject(new Error("Google Maps failed to load."));
      script.nonce = document.querySelector("script[nonce]")?.nonce || "";

      document.head.appendChild(script);
    }));

  mapsNamespace.importLibrary = (library, ...args) => {
    requestedLibraries.add(library);
    return injectScript().then(() => mapsNamespace.importLibrary(library, ...args));
  };
}

export async function loadGoogleMaps(libraries = []) {
  installGoogleMapsLoader();

  const requestedLibraries = libraries.length > 0 ? libraries : ["core"];

  await Promise.all(
    requestedLibraries.map((library) => window.google.maps.importLibrary(library))
  );

  return window.google.maps;
}
