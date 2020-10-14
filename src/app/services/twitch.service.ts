import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

export interface ITwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url?: string;
  view_count: number;
}

export interface ITwitchResponse {
  data: ITwitchUser[];
}

@Injectable({
  providedIn: "root"
})
export class TwitchService {
  constructor(private http: HttpClient) {}

  getProfileImage(username: string) {
    const params = new HttpParams().set("login", username);
    const headers = new HttpHeaders()
      .set("client-id", "")
      .set("Authorization", "Bearer ");

    return this.http.get<ITwitchResponse>("https://api.twitch.tv/helix/users", {
      params,
      headers
    });
  }
}
