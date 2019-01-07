const app = angular.module("app", [
  "ui.router",
  "routesModule",
  "LocalStorageModule",
  "uiGmapgoogle-maps",
  "ngProgress",
  "ui-notification",
  "ngMap",
  "ui.select",
  "ui.select2",
  "ngSanitize",
  "color.picker",
  "ui.bootstrap",
  "datatables",
  "ngTagsInput",
  "ngFileUpload",
  "infinite-scroll",
  "ui.tree",
  "angularMoment",
  "btorfs.multiselect",
  "htmlToPdfSave",
  "dndLists",
  "angular.chips",
  "ui.bootstrap.contextMenu",
  "cloudinary",
  "FileSaver",
  "moment-picker",
  "ngDragToReorder"
]);
app.config(config);

function config(
  NotificationProvider,
  uiGmapGoogleMapApiProvider,
  treeConfig,
  cloudinaryProvider
) {
  /* Google map config */

  uiGmapGoogleMapApiProvider.configure({
    key: "AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU",
    v: "3.exp",
    libraries: "places,weather,geometry,visualization"
  });

  /* Notification config */

  NotificationProvider.setOptions({
    delay: 3000,
    startTop: 20,
    startRight: 10,
    verticalSpacing: 20,
    horizontalSpacing: 20,
    positionX: "right",
    positionY: "top"
  });

  /* Tree configuration */
  treeConfig.defaultCollapsed = true;

  /* Cloudinary config */
  cloudinaryProvider
    .set("cloud_name", "dktnhmsjx")
    .set("upload_preset", "cloudes_frontend");
}
