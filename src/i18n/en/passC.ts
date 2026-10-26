import type { Messages } from '../types';
import type { passC as Fr } from '../fr/passC';

export const passC: Messages<typeof Fr> = {
  'pc.feel.quick': "One tap",
  'pc.cal.thread': "My pregnancy timeline",
  'pc.cal.threadCaption': "Indicative windows and your appointments, up to the due date.",
  'pc.cal.today': "Today",
  'pc.cal.due': "Due date",
  'pc.cal.next': "Next",
  'pc.cal.done': "Done",
  'pc.cal.inDays': { one: "In {count} day", other: "In {count} days" },
};
