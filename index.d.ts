import { DrawerScreenProps } from '@react-navigation/drawer'
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { NotificationRequestInput } from 'expo-notifications'
import { RequestHandler } from 'express'
import { Session } from 'express-session'
import {
  AndroidConfig,
  ApnsConfig,
  BatchResponse,
  MessagingPayload,
  WebpushConfig,
} from 'firebase-admin/lib/messaging/messaging-api'
import { Types } from 'mongoose'
import { Server } from 'socket.io'

declare namespace Eventful {
  export type ID = Types.ObjectId | string
  export type SCOPE = 'me' | 'public' | 'contacts'
  export type ParsedQs = {
    [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
  }
  export enum CATEGORY {
    None,
    Lodging,
    Carpool,
    Meet,
  }
  interface LatLng {
    latitude: number
    longitude: number
  }
  interface TimePart {
    date: Date
    allday: boolean
  }
  interface Time {
    start?: TimePart
    end?: TimePart
  }
  type NotificationPayload = MessagingPayload & {
    general?: {
      id?: string
      title?: string
      body?: {}
      subtitle?: string
      category?: string
      url?: string
      /** should this notification appear in the notifications t */
      ui?: boolean
      /** store notification in database? */
      store?: boolean
    }
    data?: MessagingPayload['data'] & { createdBy?: string; url?: string }
    webpush?: WebpushConfig
    android?: AndroidConfig
    apns?: ApnsConfig
    expo?: NotificationRequestInput

    title?: string
    message?: string
    body?: string
  }

  interface Document {
    _id: ID
    createdBy?: ID
    /** Date */
    createdAt: string
    /** Date */
    updatedAt: string
  }

  interface Event extends Document {
    name: string
    private?: boolean
    tags?: ID[]
  }

  interface Plan extends Document {
    event: ID
    category: CATEGORY
    what?: string
    location?: Location
    time?: Time
    who?: ID[]
    note?: string
  }

  interface Location extends Document {
    label?: string
    coords: LatLng
    address?: string
    category?: string
    scope?: SCOPE
    tags: ID[]
  }

  interface User extends Document {
    username: string
    password: string
    displayName?: string
    email?: string
    deviceId?: string
    method: 'password' | 'email'
  }

  interface Contact extends Document {
    user: ID
    createdBy: ID
  }

  interface Message extends Document {
    text: string
    event: ID
    replyTo: ID
  }

  interface NotificationSetting extends Document {
    /** describes notification trigger */
    key?: keyof ServerToClientEvents
    /** ID of source */
    ref?: ID
    /** source of notification */
    refModel?: 'events' | 'users' | 'plans' | 'tags' | 'pings'
    createdBy: ID
  }

  interface UserSetting extends Document {
    key: string
    value: string
    createdBy: ID
  }

  interface FcmToken extends Document {
    token: string
    createdBy: ID
  }

  interface Ping extends Document {
    type: 'ping' | 'ask' | 'going' | 'come'
    label?: string
    tags: ID[]
    location: Location
    saved_location?: Location
    time?: Date
    scope?: SCOPE
    createdBy: ID
  }

  interface Group extends Document {
    name: string
    createdBy: ID
  }

  interface GroupMembership extends Document {
    group: ID
    user: ID
    createdBy: ID
  }

  type LocalNotification = NotificationPayload & Required<Pick<NotificationPayload, 'expo'>>

  interface Reminder extends Document {
    amount: number
    unit: 'm' | 'h' | 'd' | 'w' | 'M'
    createdBy: ID
  }

  interface Feedback extends Document {
    text: string
    type: 'question' | 'suggestion' | 'bug' | 'other'
    logs?: string
    createdBy: ID
  }

  interface Tag extends Document {
    name: string
    color?: string
    createdBy: ID
  }

  interface Access extends Document {
    user: ID
    ref: ID
    refModel: NotificationSetting['refModel']
    canView?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canModerate?: boolean
    isInvited?: boolean
    isRemoved?: boolean
    createdBy: ID
  }

  type Notification = Document &
    NotificationPayload['general'] &
    NotificationSetting & {
      user: ID
    }

  interface InviteLink extends Document {
    ref: ID
    refModel: NotificationSetting['refModel']
    expiresAt: Date
  }

  namespace API {
    interface RouteOptions {
      route: {
        getAll?: RequestHandler
        create?: RequestHandler
        get?: RequestHandler
        update: RequestHandler
        delete: RequestHandler
      }
    }

    interface PingGet extends Omit<Ping, 'tags' | 'createdBy' | 'saved_location'> {
      tags: Tag[]
      saved_location?: Location
      createdBy: User
    }

    interface PingAdd extends Omit<Ping, keyof Document | 'location'> {
      location: LocationAdd
    }

    interface PlanGet extends Omit<Plan, 'who'> {
      who?: User[]
    }

    interface EventGet extends Omit<Event, 'tags'> {
      time: Time
      groups: Group[]
      plans: PlanGet[]
      who: User[]
      tags?: Tag[]
    }

    interface EventUpdate extends Partial<Omit<Event, keyof Document>> {}

    type EventAdd = Omit<Event, keyof Document>

    interface PlanAdd extends Omit<Plan, keyof Document | 'event'> {
      location?: LocationAdd
    }

    interface PlanEdit extends Omit<Plan, keyof Document | 'event' | 'category'> {
      _id: ID
      location?: LocationAdd
      who?: ID[]
      category?: Plan['category']
    }

    interface LocationGet extends Omit<Location, 'tags'> {
      tags: Tag[]
    }

    interface LocationAdd extends Omit<Location, keyof Document | 'tags'> {
      tags?: ID[]
    }

    interface LocationEdit extends Omit<Location, keyof Document> {}

    interface MessageGet extends Omit<Message, 'replyTo' | 'createdBy'> {
      replyTo?: Message & { createdBy: User }
      createdBy: User
    }

    interface MessageAdd extends Pick<Message, 'text'> {
      replyTo?: Message['replyTo']
    }

    interface MessageEdit extends Pick<Message, '_id' | 'text'> {
      replyTo?: Message['replyTo']
    }

    interface SettingsGet {
      searchVisibility?: 'any' | 'contacts'
    }
    type SettingsEdit = SettingsGet

    interface ReminderEdit extends Omit<Reminder, 'createdBy'> {}

    interface FeedbackEdit extends Omit<Feedback, keyof Document | 'createdBy'> {}

    interface AccessGet {
      tags: (Access & {
        tag: Tag
      })[]
      events: (Access & {
        event: Event
      })[]
    }

    interface AccessEdit extends Omit<Access, keyof Document | 'createdBy'> {}

    interface TagGet extends Omit<Tag, 'createdBy'> {
      events: EventGet[]
      pings: PingGet[]
      users: User[]
      createdBy: User
    }

    interface TagEdit extends Omit<Tag, keyof Document | 'createdBy'> {}

    interface LogInOptions {
      username: string
      password: string
      remember?: boolean
    }

    interface SignUpOptions {
      username: string
      password: string
      confirm_password: string
      remember?: boolean
    }
  }

  namespace RN {
    type Storage = {
      lastEvent?: ID
      lastEventName?: string
      agendaTbd?: boolean
      devMode?: boolean
      agendaScrollY?: number
      messagesCollapsed?: boolean
      agendaView?: 'tbd' | 'agenda'
      pingScope: Eventful.Ping['scope']
      pingTags: string
      askedBgPerms: boolean
      location: Eventful.Location['coords']
      pingListCollapsed: boolean
    }

    /*
Welcome
Auth
App
    Agenda/Home
    Event
    EventSetting
    ContactSelect
    PlanEdit
    NotificationSetting
    User
    Tag
    UserSearch
    UserSetting
    ReminderEdit
    Contacts
    Tags
    Dev
    */

    // pings

    type RootStackParmList = {
      Auth: undefined
      Pings: undefined
      Tags: undefined
      Tag: { id: ID }
      User: { id: ID }
      Invite: { id: ID }
      Locations: undefined
    }
    type ScreenProps<S extends keyof RootStackParmList> = NativeStackScreenProps<
      RootStackParmList,
      S
    >

    // type RootDrawerParamList = {
    //   Auth: undefined
    //   Pings: undefined
    //   Other: NavigatorScreenParams<OtherStackParamList>
    // }
    // type ScreenProps<S extends keyof RootDrawerParamList> = DrawerScreenProps<
    //   RootDrawerParamList,
    //   S
    // >

    // type OtherStackParamList = {
    //   Tags: undefined
    //   Tag: { id: ID }
    //   User: { id: ID }
    //   Invite: { id: ID }
    //   Locations: undefined
    // }
    // type OtherScreenProps<S extends keyof OtherStackParamList> = CompositeScreenProps<
    //   NativeStackScreenProps<OtherStackParamList, S>,
    //   ScreenProps<'Other'>
    // >

    // type RootStackParamList = {
    //   Welcome: undefined
    //   Auth: undefined
    //   Main: NavigatorScreenParams<MainStackParamList>
    // }

    // type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
    //   RootStackParamList,
    //   T
    // >

    // eventful

    type MainStackParamList = {
      Events: undefined
      Event: { event: ID }
      ContactSelect: { user: ID; selected: ID[]; showMe?: boolean }
      PlanEdit: { plan: ID }
      EventSetting: {
        event: ID
      }
      NotificationSetting: {
        type: Eventful.NotificationSetting['refModel']
        id: ID
      }
      Notifications: {
        user: ID
      }
      User: { user: ID }
      Tag: { tag: ID }
      UserSearch: undefined
      UserSetting: {
        user: ID
      }
      ReminderEdit: {
        user: ID
      }
      Contacts: { user: ID }
      Tags: { user: ID }
      Dev: undefined
      Map: undefined
      Pings: undefined
    }

    type MainStackScreenProps<T extends keyof MainStackParamList> = CompositeScreenProps<
      NativeStackScreenProps<MainStackParamList, T>,
      RootStackScreenProps<'Main'>
    >
  }
}

export interface ClientToServerEvents {
  'event:join': (event: Eventful.ID, user: Eventful.ID) => void
  'event:leave': (event: Eventful.ID) => void
  'room:join': (info: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) => void
  'room:leave': (info: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) => void
  'user:join': (user: Eventful.ID) => void
  'user:leave': () => void
  'tag:join': (user: Eventful.ID) => void
  'tag:leave': () => void
}

export interface ServerToClientEvents {
  notification: (payload: Eventful.NotificationPayload) => void
  'message:add': (message: Eventful.API.MessageGet) => void
  'message:edit': (message: Eventful.API.MessageGet) => void
  'message:delete': (message: Eventful.ID) => void
  'plan:add': (plan: Eventful.API.PlanGet) => void
  'plan:edit': (plan: Eventful.API.PlanGet) => void
  'plan:delete': (plan: Eventful.ID) => void
  'access:change': (access: Eventful.Access) => void
  'ping:add': (ping: Eventful.API.PingGet) => void
  'ping:delete': (ping: Eventful.ID) => void
}

declare module 'express-session' {
  interface SessionData {
    user: Eventful.User
  }
}

declare global {
  declare module '*.png' {
    export default '' as string
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      REACT_APP_IS_MOBILE: string
      DATABASE_URI: string
      DATABASE_NAME: string
      SESSION_SECRET: string
      REACT_APP_SOCKET_URL: string
      REACT_APP_API_URL: string
      FIREBASE_PROJECT_ID: string
      FIREBASE_PRIVATE_KEY: string
      FIREBASE_CLIENT_EMAIL: string
      REACT_APP_FIREBASE_API_KEY: string
      REACT_APP_MAPBOX_TOKEN: string
      MAPS_KEY: string
      REACT_APP_DEBUG: string
      PUBLIC_URL: string
    }
  }

  namespace Express {
    interface Request {
      io: Server<ClientToServerEvents, ServerToClientEvents>
      fcm: {
        // messaging: Messaging
        send: (
          setting: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'> & {
            users?: Eventful.ID[]
          },
          data?: Eventful.NotificationPayload
        ) => Promise<BatchResponse[]>
        addToken: (token: string, user: Eventful.ID) => Promise<Eventful.FcmToken>
      }
      session: Session & {
        user?: Eventful.User
      }
      notification: {
        send: (
          setting: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'> & {
            users?: Eventful.ID[]
          },
          data?: Eventful.NotificationPayload
        ) => Promise<void>
      }
    }
  }

  namespace ReactNavigation {
    interface RootParamList extends Eventful.RN.RootDrawerParamList {}
  }
}
