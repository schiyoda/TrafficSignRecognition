const parseJSON = response => response.json();

const formData = (params) => {
  const data = new FormData();
  Object.keys(params).forEach((k) => {
    data.append(k, params[k]);
  });
  return data;
};

const handleErrors = (response) => {
  if (response.error) {
    throw response;
  }
  return response;
};

/**
 * Calls the Visual Recognition.classify() endpoint.
 *
 * @param  {Object} params The parameters
 * @return {Promise}       The request promise
 */
export const classifyImage = params =>
  fetch('/api/classify', {
    method: 'POST',
    body: formData(params),
  })
  .then(parseJSON)
  .then(handleErrors);