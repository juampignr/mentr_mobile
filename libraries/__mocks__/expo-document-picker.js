let mockResult = { canceled: true };

export function getDocumentAsync() {
  return Promise.resolve(mockResult);
}

export function __setMockDocumentResult(result) {
  mockResult = result;
}
