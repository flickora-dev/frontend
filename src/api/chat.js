import axios from './axios';

export const chatAPI = {
  sendMessage: (message, movieId = null, conversationId = null, signal = null) =>
    axios.post('/chat/send/', {
      message,
      movie_id: movieId,
      conversation_id: conversationId,
    }, { signal }),

  getConversations: () =>
    axios.get('/chat/conversations/'),

  getConversation: (id) =>
    axios.get(`/chat/${id}/conversation_detail/`),

  deleteConversation: (id) =>
    axios.delete(`/chat/${id}/delete_conversation/`),
};