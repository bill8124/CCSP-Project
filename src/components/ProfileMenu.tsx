import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import React, {useState} from 'react';

const provider = new GoogleAuthProvider();

export function ProfileMenu() {
  const auth = getAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>();
  const handleLogin = () => {
    signInWithPopup(auth, provider);
  };
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setUser(user);
    } else {
      setUser(undefined);
    }
    setIsLoading(false);
  });

  if (isLoading) {
    return null;
  }
  if (user) {
    if (user.photoURL) {
      return <img className="profilePicture" src={user.photoURL}></img>;
    }
    return <div>{user.displayName}</div>;
  }
  return (
    <button className="btn btn-primary" onClick={handleLogin}>
      Google 登入
    </button>
  );
}
