import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Notification, NotificationRequest, NotificationRequestInput } from 'expo-notifications'
import { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import { Messaging } from 'firebase-admin/lib/messaging/messaging'
import {
  AndroidConfig,
  ApnsConfig,
  BatchResponse,
  MessagingPayload,
  WebpushConfig,
} from 'firebase-admin/lib/messaging/messaging-api'
import { Session } from 'inspector'
import { Types } from 'mongoose'
import { Server } from 'socket.io'

declare namespace Eventful {
  export type ID = Types.ObjectId
  export type ParsedQs = { [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[] }
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
    data?: MessagingPayload['data'] & { createdBy?: string; url?: string }
    webpush?: WebpushConfig
    android?: AndroidConfig
    apns?: ApnsConfig
    expo?: NotificationRequestInput
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
    coords?: LatLng
    address?: string
  }

  interface User extends Document {
    username: string
    password: string
  }

  interface Contact extends Document {
    user: ID
  }

  interface Message extends Document {
    text: string
    event: ID
    replyTo: ID
  }

  interface NotificationSetting extends Document {
    /** describes notification trigger */
    key: keyof ServerToClientEvents
    /** ID of source */
    ref: ID
    /** source of notification */
    refModel: 'events' | 'users' | 'plans'
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
    label: string
    location: Location
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

  namespace API {
    interface RouteOptions {
      route: {
        getAll?: RequestHandler
        create?: RequestHandler
        get: RequestHandler
        update: RequestHandler
        delete: RequestHandler
      }
    }

    interface PingGet extends Ping {
      createdBy: User
    }

    interface PingAdd extends Ping {}

    interface PlanGet extends Plan {
      who?: User[]
    }

    interface EventGet extends Event {
      time: Time
      groups: Group[]
      plans: PlanGet[]
      who: User[]
    }

    interface EventUpdate extends Omit<Event, keyof Document> {}

    type EventAdd = Pick<Event, 'name'>

    interface PlanAdd extends Omit<Plan, keyof Document | 'event'> {
      location?: LocationAdd
    }

    interface PlanEdit extends Omit<Plan, keyof Document | 'event'> {
      _id: ID
      location?: LocationAdd
      who?: ID[]
      category?: Plan['category']
    }

    interface LocationAdd extends Omit<Location, keyof Document> {}

    interface MessageGet extends Message {
      replyTo?: Message & { createdBy: User }
      createdBy: User
    }

    interface MessageAdd extends Pick<Message, 'text' | 'replyTo'> {
      replyTo?: Message['replyTo']
    }

    interface MessageEdit extends Pick<Message, '_id' | 'text' | 'replyTo'> {
      replyTo?: Message['replyTo']
    }

    interface SettingsGet {
      searchVisibility?: 'any' | 'contacts'
    }
    type SettingsEdit = SettingsGet

    interface ReminderEdit extends Omit<Reminder, 'createdBy'> {}

    interface FeedbackEdit extends Omit<Feedback, 'createdBy', '_id', 'createdAt', 'updatedAt'> {}

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
    }

    type RootStackParamList = {
      Welcome: undefined
      Auth: undefined
      App: NavigatorScreenParams<AppTabParamList>
    }

    type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
      RootStackParamList,
      T
    >

    type AppTabParamList = {
      MapTab: NavigatorScreenParams<MapStackParamList>
      PingsTab: NavigatorScreenParams<PingsStackParamList>
      UserTab: NavigatorScreenParams<UserStackParamList>

      AgendaTab: NavigatorScreenParams<AgendaStackParamList>
      EventTab: NavigatorScreenParams<EventStackParamList>
    }

    type AppTabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList, T>,
      RootStackScreenProps<'App'>
    >

    type MapStackParamList = {
      Map: undefined
    }

    type MapStackScreenProps<T extends keyof MapStackParamList> = CompositeScreenProps<
      NativeStackScreenProps<MapStackParamList, T>,
      CompositeScreenProps<
        BottomTabScreenProps<AppTabParamList, 'MapTab'>,
        RootStackScreenProps<'App'>
      >
    >

    type PingsStackParamList = {
      Pings: undefined
    }

    type PingsStackScreenProps<T extends keyof PingsStackParamList> = CompositeScreenProps<
      NativeStackScreenProps<PingsStackParamList, T>,
      CompositeScreenProps<
        BottomTabScreenProps<AppTabParamList, 'PingsTab'>,
        RootStackScreenProps<'App'>
      >
    >

    type AgendaStackParamList = {
      Events: undefined
    }

    type AgendaStackScreenProps<T extends keyof AgendaStackParamList> = CompositeScreenProps<
      NativeStackScreenProps<AgendaStackParamList, T>,
      CompositeScreenProps<
        BottomTabScreenProps<AppTabParamList, 'AgendaTab'>,
        RootStackScreenProps<'App'>
      >
    >

    type EventStackParamList = {
      Event: { event: ID }
      PlanEdit: { plan: ID }
      ContactSelect: { user: ID; selected: ID[] }
      NotificationSetting: {
        type: Eventful.NotificationSetting['refModel']
        id: ID
      }
    }

    type EventStackScreenProps<T extends keyof EventStackParamList> = CompositeScreenProps<
      CompositeScreenProps<
        NativeStackScreenProps<EventStackParamList, T>,
        BottomTabScreenProps<AppTabParamList, 'EventTab'>
      >,
      RootStackScreenProps<'App'>
    >

    type UserStackParamList = {
      User: { user: ID }
      UserSearch: undefined
      UserSetting: {
        user: ID
      }
      ReminderEdit: {
        user: ID
      }
      Contacts: { user: ID }
      Dev: undefined
    }

    type UserStackScreenProps<T extends keyof UserStackParamList> = CompositeScreenProps<
      CompositeScreenProps<
        NativeStackScreenProps<UserStackParamList, T>,
        BottomTabScreenProps<AppTabParamList, 'UserTab'>
      >,
      RootStackScreenProps<'App'>
    >
  }
}

export interface ClientToServerEvents {
  'event:join': (event: Eventful.ID, user: Eventful.ID) => void
  'event:leave': (event: Eventful.ID) => void
  'room:join': (info: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) => void
  'room:leave': (info: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) => void
}

export interface ServerToClientEvents {
  notification: (payload: Eventful.NotificationPayload) => void
  'message:add': (message: Eventful.API.MessageGet) => void
  'message:edit': (message: Eventful.API.MessageGet) => void
  'message:delete': (message: Eventful.ID) => void
  'plan:add': (plan: Eventful.API.PlanGet) => void
  'plan:edit': (plan: Eventful.API.PlanGet) => void
  'plan:delete': (plan: Eventful.ID) => void
}

declare module 'express-session' {
  interface SessionData {
    user: Eventful.User
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      IS_MOBILE: boolean
      DATABASE_URI: string
      DATABASE_NAME: string
      SESSION_SECRET: string
      REACT_APP_SOCKET_URL: string
      REACT_APP_API_URL: string
      FIREBASE_PROJECT_ID: string
      FIREBASE_PRIVATE_KEY: string
      FIREBASE_CLIENT_EMAIL: string
      REACT_APP_FIREBASE_API_KEY: string
      MAPS_KEY: string
    }
  }

  namespace Express {
    interface Request {
      io: Server<ClientToServerEvents, ServerToClientEvents>
      fcm: {
        messaging: Messaging
        send: (
          setting: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>,
          data: Eventful.NotificationPayload
        ) => Promise<BatchResponse[]>
        addToken: (token: string, user: Eventful.ID) => Promise<Eventful.FcmToken>
      }
      session: {
        user?: Eventful.User
      }
      notification: {
        send: (
          setting: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>,
          data: Eventful.NotificationPayload
        ) => Promise<void>
      }
    }
  }

  namespace ReactNavigation {
    interface RootParamList extends Eventful.RN.RootStackParamList {}
  }
}
