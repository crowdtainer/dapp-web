<script context="module" lang="ts">
    
    /** @type {import('@sveltejs/kit').Load} */
    export function load({ error, status }) {
      return {
        props: {
          title: `${status} - ${error.message}`
        }
      };
    }
  </script>
  
  <script>
    export let title = "";
  </script>
  
  <h1>{title}</h1>

  <figure class="max-w-4xl mx-auto grid grid-cols-1 py-6 px-4 sm:p-6 md:py-10 md:px-8 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800">
    <img class="w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src="/CrowdtainerLogo.svg" alt="" width="384" height="512">
    <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
      <blockquote>
        <p class="text-white text-center text-lg font-medium">
          {title}
        </p>
      </blockquote>
      <figcaption class="font-medium">
        <div class="text-center text-sky-500 dark:text-sky-400">
          No containers here.
        </div>
      </figcaption>
    </div>
  </figure>
