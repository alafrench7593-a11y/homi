import type { profilePhoto as fr } from '../fr/profilePhoto';
import type { Messages } from '../types';

export const profilePhoto: Messages<typeof fr> = {
  'pphoto.title': 'Profile photo',
  'pphoto.add': 'Add a photo',
  'pphoto.change': 'Change photo',
  'pphoto.current': 'Your profile photo',
  'pphoto.hasPhoto': 'It shows at the top of screens and to the members of your household.',
  'pphoto.noPhoto': 'No photo yet: your initial is shown instead.',
  'pphoto.camera': 'Take a photo',
  'pphoto.library': 'Choose from library',
  'pphoto.remove': 'Remove photo',
  'pphoto.removeTitle': 'Remove photo',
  'pphoto.removeQ': 'Your profile photo will be deleted; your initial will be shown instead.',
  'pphoto.saved': 'Profile photo saved',
  'pphoto.removed': 'Photo removed',
  'pphoto.privacy': 'Visible only to you and the members of your household (other parent, nanny, invited grandparents). It is cropped, resized and saved without its GPS location, in a private space.',
  'pphoto.errLogin': 'Sign in to add a photo.',
  'pphoto.err.permission_camera': 'Allow camera access in your phone settings.',
  'pphoto.err.permission_library': 'Allow photo access in your phone settings.',
  'pphoto.err.unreadable': 'This image couldn’t be read. Try another photo.',
  'pphoto.err.too_large': 'This photo is too large. Try another one.',
};
