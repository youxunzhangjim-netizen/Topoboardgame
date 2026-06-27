import { Peer } from 'peerjs';

if (!window.Peer) {
  window.Peer = Peer;
}

if (!window.peerjs) {
  window.peerjs = { Peer };
}
