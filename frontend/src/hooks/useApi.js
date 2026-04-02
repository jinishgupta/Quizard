import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '../utils/api';

// User Profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => get('/api/users/profile'),
  });
};

export const useUserStats = (userId) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => get(`/api/users/${userId}/stats`),
    enabled: !!userId,
  });
};

export const useUserBadges = (userId) => {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => get(`/api/users/${userId}/badges`),
    enabled: !!userId,
  });
};

export const useUserMastery = (userId) => {
  return useQuery({
    queryKey: ['userMastery', userId],
    queryFn: () => get(`/api/users/${userId}/mastery`),
    enabled: !!userId,
  });
};

// Credits
export const useCreditBalance = () => {
  return useQuery({
    queryKey: ['creditBalance'],
    queryFn: () => get('/api/credits/balance'),
  });
};

export const useCreditHistory = () => {
  return useQuery({
    queryKey: ['creditHistory'],
    queryFn: () => get('/api/credits/history'),
  });
};

export const useRedeemCredits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/credits/redeem', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditHistory'] });
    },
  });
};

// Game
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => get('/api/game/categories'),
  });
};

export const useRecentRounds = (limit = 3) => {
  return useQuery({
    queryKey: ['recentRounds', limit],
    queryFn: () => get(`/api/game/history?limit=${limit}`),
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/game/session', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: ({ sessionId, ...data }) => post(`/api/game/session/${sessionId}/answer`, data),
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId) => post(`/api/game/session/${sessionId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userMastery'] });
      queryClient.invalidateQueries({ queryKey: ['leagueRank'] });
    },
  });
};

export const useUnlockExplanation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/game/unlock-explanation', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

export const useHintEliminate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/game/hint/eliminate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

export const useHintClue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/game/hint/clue', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

export const useHintFirstLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/game/hint/first-letter', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

// League
export const useLeaderboard = (tier) => {
  return useQuery({
    queryKey: ['leaderboard', tier],
    queryFn: () => get(`/api/league/leaderboard${tier ? `?tier=${tier}` : ''}`),
  });
};

export const useLeagueRank = () => {
  return useQuery({
    queryKey: ['leagueRank'],
    queryFn: () => get('/api/league/rank'),
  });
};

export const useLeagueTiers = () => {
  return useQuery({
    queryKey: ['leagueTiers'],
    queryFn: () => get('/api/league/tiers'),
  });
};

// Challenges
export const useCreateChallenge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => post('/api/challenge/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
};

export const useActiveChallenges = () => {
  return useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => get('/api/challenge/active'),
  });
};
