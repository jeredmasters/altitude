<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateScaffoldsTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('scaffolds', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->string('company');
		    $table->string('key');
		    $table->string('key_base');
		    $table->string('title');
		    $table->string('type');
            $table->string('properties')->default('{}');
		    $table->string('status')->nullable();
		    $table->string('created_by');
		    $table->string('created_ts');
		    $table->text('data')->nullable();
		    $table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('scaffolds');
	}
}
