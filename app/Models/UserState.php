<?php

/**
 * State short summary.
 *
 * State description.
 *
 * @version 1.0
 * @author jered
 */
class UserState extends BaseModel {
    protected $table = "user_state";
    protected $json = array('settings','ui_state');

    public function touch($ip = null){
        if ($ip != null){
            $this->last_ip = $ip;
        }
        $this->last_touch = date('u');
        $this->save();
    }

    public static function GetState($user = null, $ip = null){
        if ($user == null){
            $user = User::currentUser();
        }
        if($user != null){
            if (is_object($user)){
                $user = $user->key_base;
            }
            if (is_array($user)){
                $user = $user['key_base'];
            }
            $state = UserState::where('user','=',$user)->first();
            if ($state == null){
                $state = new UserState;
                $state->user = $user;   
                $state->last_update = 0;
            }
            if ($ip != null){
                $state->touch($ip);
            }
            if (!isset($state->id) || $state->id == null){
                $state->save();
            }
            
            
            return $state;
        }
        return null;
    }
    public static function SetState($user, $data, $ip = null){
        $state = static::GetState($user,$ip);
        $copyvals = array('settings','ui_state','last_update');
        foreach($copyvals as $name){
            if (isset($data[$name])){
                $state->$name = $data[$name];
            }
        }
        $state->save();
        return $state;
    }
}
