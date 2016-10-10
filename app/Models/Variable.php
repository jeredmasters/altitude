<?php


class Variable extends Eloquent {
    
	protected $table = 'variables';
	
	public static function get($key, $default = null){
	    $variable = Variable::where('key','=',$key)->first();
	    if ($variable != null){
	        return $variable->value;
	    }
	    return $default;
	}
	
	public static function set($key, $value){
	    $variable = Variable::where('key','=',$key)->first();
	    if ($variable == null){
	        $variable = new Variable;
	        $variable->key = $key;
	    }
	    $variable->value = $value;
	    $variable->save();
	    return $variable;
	}
    
}