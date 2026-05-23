const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://openbox-0tuh.onrender.com';

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  return null;
}

function saveAuthToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      saveAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

export function googleLogin() {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
}

export async function getAuthProfile() {
  try {
    const token = getAuthToken();
    console.log("JWT token:", token);

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Profile response status:", response.status);

    const data = await response.json();
    console.log("Profile response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to get profile");
    }

    return data; // { user: { ... } }
  } catch (error) {
    console.error("Error getting profile:", error);
    throw error;
  }
}


export function logout() {
  clearAuthToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login"; 
  }

}

export async function createProject(projectData) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create project');
    }

    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function getUserProjects() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get projects');
    }

    return data;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
}

export async function deleteProject(projectId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete project');
    }

    return data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function getProjectById(projectId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get project');
    }

    return data;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

export async function addCollaborator(projectId, collaboratorData) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects/collaborators/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(collaboratorData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add collaborator');
    }

    return data;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
}

export async function getUserProfile() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }

    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function getUserActivity() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user/activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch activity");
    }

    return data;
  } catch (error) {
    console.error("Error getting user activity:", error);
    throw error;
  }
}

export async function updateUserProfile(profileData) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function getFileById(fileId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get file');
    }

    return data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
}

export async function getFileHistory(fileId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get file history');
    }

    return data;
  } catch (error) {
    console.error('Error getting file history:', error);
    throw error;
  }
}

export async function commitChanges(payload) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/commits`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to commit changes');
    }

    return data;
  } catch (error) {
    console.error('Error committing changes:', error);
    throw error;
  }
}

export async function getCommit(commitId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/commits/${commitId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get commit');
    }

    return data;
  } catch (error) {
    console.error('Error getting commit:', error);
    throw error;
  }
}

export async function getAllCommits(repoId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/commits/repo/${repoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get commits');
    }

    return data;
  } catch (error) {
    console.error('Error getting commits:', error);
    throw error;
  }
}

export async function getCommitDiff(commitId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/commits/${commitId}/diff`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get commit diff');
    }

    return data;
  } catch (error) {
    console.error('Error getting commit diff:', error);
    throw error;
  }
}

export function isAuthenticated() {
  const token = getAuthToken();
  return token !== null && token !== undefined && token !== '';
}




// Collaborators apis -> 

export async function inviteCollaborator(inviteData) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/collaboration/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(inviteData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send invite");
    }

    return data;
  } catch (error) {
    console.error("Error sending invite:", error);
    throw error;
  }
}
// frontned usage -> 
// await inviteCollaborator({
//   project_id: projectId,
//   inviteeEmail: email,
// });


export async function getMyInvitations() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/collaboration/my-invitations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch invitations");
    }

    return data;
  } catch (error) {
    console.error("Error getting invitations:", error);
    throw error;
  }
}
// frontiend use -> 
// const invites = await getMyInvitations();
// console.log(invites.invitations);


export async function acceptInvitation(inviteId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/collaboration/${inviteId}/accept`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to accept invitation");
    }

    return data;
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw error;
  }
}
// frontned -> await acceptInvitation(invite._id);


export async function rejectInvitation(inviteId) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/collaboration/${inviteId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to reject invitation");
    }

    return data;
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    throw error;
  }
}

// frontned -> await rejectInvitation(invite._id);


// frontend -> diff patch match api 
export async function getFileDiff(repoId, filePath, fromVersion, toVersion) {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("User not authenticated");

    const url = `${API_BASE_URL}/api/commits/diff?repoId=${repoId}&file_path=${encodeURIComponent(
      filePath
    )}&fromVersion=${fromVersion}&toVersion=${toVersion}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch file diff");
    }

    return data;
  } catch (error) {
    console.error("Error fetching file diff:", error);
    throw error;
  }
}
 /// frontned usage ->
//  const repoId = "692efad1acfbc40a60171a83";
//  const filePath = "abcd/a.html";
//  const fromVersion = 2;
//  const toVersion = 3;

//  const diffData = await getFileDiff(repoId, filePath, fromVersion, toVersion);
//  console.log(diffData.diff);
 ///


export const API_URL = API_BASE_URL;
export async function getUserStats() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || "Failed to fetch stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getUserStats:", error);
    throw error;
  }
}

export async function getFriends() {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/user/friends`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to get friends");
  return res.json();
}

export async function addFriend(friendId) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/user/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ friendId })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to add friend: ${errText}`);
  }
  return res.json();
}
