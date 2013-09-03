window.HomeView = Backbone.View.extend({

    initialize:function () {
        this.render();
    },

    render:function () {
        $(this.el).html(this.template());

		var all_files = [],
		    current_file_id = 0,
		    locked = false,
		    prev_count_files = 0,
		    waiting = 0,
		    drop, dropzone, handleNextFile, handleReaderLoad, noopHandler;

		noopHandler = function(evt) {
			evt.stopPropagation();
			evt.preventDefault();
		};

		drop = function(evt) {

			noopHandler(evt);

			var files = evt.dataTransfer.files,
			    count = files.length,
			    i, j;

			if ( count > 0 ) {

				prev_count_files = all_files.length;

				if ( $("#dropzoneLabel", this.el).length !== 0 ) {
					$("#dropzone", this.el).html('');
				}

				for ( i = prev_count_files + waiting, j = 0; i < prev_count_files + files.length + waiting; i++, j++ ) {
					$("#dropzone", this.el).append('<div class="file ' + i + '"><div class="name">' + files[j].name + '</div><div class="progress">Waiting...</div></div>');
				}

				waiting += count;

				if ( ! locked ) {
					waiting -= count;
					all_files.push.apply(all_files, files);
					handleNextFile();
				}
			}
		};

		handleReaderLoad = function(evt) {

			var current_file = {};

			current_file.name = all_files[current_file_id].name;
			current_file.type = all_files[current_file_id].type;
			current_file.contents = evt.target.result;

			$.post('/upload', current_file, function(data, textStatus, jqXHR) {

				
				if ( jqXHR.status == 200 ) {
					$(".file." + current_file_id + " .progress", this.el).html("Uploaded");

					// Redirect to somewhere here with a successful upload
//					console.log( data.id );
//					window.location.href = "http://localhost:2020/uploaded/" + data.id;

				} else {
					$(".file." + current_file_id + " .progress", this.el).html("Failed");
				}

				all_files[current_file_id] = 1;
				current_file_id++;
				handleNextFile();
			});
		};

		handleNextFile = function() {

			if ( current_file_id < all_files.length ) {

				locked = true;

				$(".file." + current_file_id + " .progress", this.el).html("Uploading...");

				var current_file = all_files[current_file_id],
				    reader = new FileReader();

				reader.onload = handleReaderLoad;
				reader.readAsDataURL(current_file);

			} else {
				locked = false;
			}
		};

		dropzone = $("#dropzone", this.el).get(0);

		console.log( dropzone );
		dropzone.addEventListener("dragenter", noopHandler, false);
		dropzone.addEventListener("dragexit", noopHandler, false);
		dropzone.addEventListener("dragover", noopHandler, false);
		dropzone.addEventListener("drop", drop, false);

        return this;
    }

});