package httpapi

import "net/http"

// UploadImage godoc
// @Summary Upload image
// @Description Stub image upload; returns a placeholder URL.
// @Tags images
// @Accept json
// @Produce json
// @Param request body ImageUploadRequest true "Image upload"
// @Success 201 {object} ImageResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/images [post]
func (api *API) UploadImage(w http.ResponseWriter, r *http.Request) {
	var req ImageUploadRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	url, err := generatePlaceholderURL()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "image_upload_failed", "failed to generate image URL")
		return
	}

	writeJSON(w, http.StatusCreated, ImageResponse{URL: url})
}

// DeleteImage godoc
// @Summary Delete image
// @Description Stub image deletion.
// @Tags images
// @Produce json
// @Param url query string true "Image URL"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Router /api/images [delete]
func (api *API) DeleteImage(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "url is required")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
