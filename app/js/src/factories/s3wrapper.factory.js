(() => {
  angular.module("app").factory("uploadFactory", uploadFactory);

  function uploadFactory(
    $http,
    $location,
    localStorageService,
    apiFactory,
    Upload,
    cloudinary,
    Notification
  ) {
    /* AWS CONFIG */
    const bucketName = "3dfilesdata";
    const bucketRegion = "ap-south-1";
    let config = {
      signerUrl: `https://api.staging.cloudes.eu/signv4_auth`,
      aws_key: "AKIAJMO3YJTPKYV5DN5A",
      bucket: "3dfilesdata/test",
      awsRegion: bucketRegion,
      computeContentMd5: true,
      allowS3ExistenceOptimization: true,
      cryptoMd5Method: function(data) {
        return AWS.util.crypto.md5(data, "base64");
      },
      cryptoHexEncodedHash256: function(data) {
        return AWS.util.crypto.sha256(data, "hex");
      }
    };

    return {
      init: () => {
        return Evaporate.create(config);
      },
      start: function(handler) {
        let fileUpload = this.init();

        fileUpload.then(handler).catch(e => {
          console.log(e);
        });
      },
      pause: function(file) {
        this.pause(`3dfilesdata/test/${file.name}`, { force: true })
          .then(function() {
            file.isPaused = true;
            console.log("Paused!");
          })
          .catch(e => {
            console.log(e);
          });
      },
      resume: function(file) {
        this.resume(`3dfilesdata/test/${file.name}`)
          .then(function() {
            file.isPaused = false;
            console.log("Resumed!");
          })
          .catch(e => {
            console.log(e);
          });
      },
      abort: function(file) {
        this.cancel(`3dfilesdata/test/${file.name}`)
          .then(function() {
            //file.aborted = true;
            console.log("Canceled!");
          })
          .catch(e => {
            console.log(e);
          });
      }
      // upload: file => {
      //   console.log("file!!", file);
      //   /* Check file size */
      //   if (file.size > 10000000) {
      //     /* s3 for files larger than 10mb */
      //     const params = { Key: file.name, ContentType: file.type, Body: file };
      //     s3.putObject(params)
      //       .on("httpUploadProgress", progress => {
      //         /* TODO: Grabbing progress event */
      //         console.log("progres", progress);
      //       })
      //       .send((err, data) => {
      //         if (err) {
      //           console.log(err);
      //         } else {
      //           console.log("done", data);
      //         }
      //       });
      //   } else {
      //     /* Send to cloudinary */
      //     Upload.upload({
      //       url:
      //         "https://api.cloudinary.com/v1_1/" +
      //         cloudinary.config().cloud_name +
      //         "/upload",
      //       data: {
      //         upload_preset: cloudinary.config().upload_preset,
      //         tags: file.name,
      //         context: "photo=" + Date.now(),
      //         file: file
      //       }
      //     })
      //       .then(resp => {
      //         console.log("resp!!", resp);
      //       })
      //       .catch(e => {
      //         console.log("err", e);
      //       });
      //   }
      // }
    };
  }
})();
